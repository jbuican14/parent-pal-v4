#!/usr/bin/env python3
"""
Event Parser Tests

Comprehensive test suite for the event parser service including
regex parsing, Ollama integration, and database operations.
"""

import pytest
import json
import asyncio
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Add parser to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from parser.main import EventParser, RegexParser, OllamaClient, ParsedEvent, EmailRecord

class TestRegexParser:
    """Test regex-based email parsing"""
    
    def setup_method(self):
        self.parser = RegexParser()
    
    def test_parse_simple_event(self):
        """Test parsing a simple event email"""
        subject = "Soccer Practice Tomorrow"
        body = """
        Hi parents,
        
        Soccer practice is scheduled for 2024-03-15 at 3:00 PM.
        Location: Community Sports Center
        Please bring: Water bottle, cleats, shin guards
        
        Thanks!
        """
        
        event, confidence = self.parser.parse(body, subject)
        
        assert event is not None
        assert event.title == "Soccer Practice Tomorrow"
        assert "2024-03-15" in event.start_ts
        assert event.location == "Community Sports Center"
        assert event.prep_items is not None
        assert "Water bottle" in event.prep_items
        assert confidence >= 0.4
    
    def test_parse_complex_date_formats(self):
        """Test parsing various date formats"""
        test_cases = [
            ("Event on 2024-03-15", ["2024-03-15"]),
            ("Meeting on 3/15/2024", ["2024-03-15"]),
            ("Party on March 15, 2024", ["2024-03-15"]),
            ("Conference 3-15-2024", ["2024-03-15"]),
        ]
        
        for text, expected_dates in test_cases:
            dates = self.parser._extract_dates(text)
            assert dates == expected_dates, f"Failed for: {text}"
    
    def test_extract_location_patterns(self):
        """Test location extraction patterns"""
        test_cases = [
            ("Location: Main Auditorium", "Main Auditorium"),
            ("Venue: Central Park", "Central Park"),
            ("Address: 123 Main St", "123 Main St"),
            ("held at the gymnasium", "the gymnasium"),
            ("taking place at school library", "school library"),
        ]
        
        for text, expected in test_cases:
            location = self.parser._extract_location(text)
            assert location == expected, f"Failed for: {text}"
    
    def test_extract_prep_items(self):
        """Test preparation items extraction"""
        text = """
        Please bring: Water bottle, snacks, comfortable shoes
        Don't forget your permission slip!
        """
        
        items = self.parser._extract_prep_items(text)
        assert items is not None
        assert "Water bottle" in items
        assert "snacks" in items
        assert "comfortable shoes" in items
    
    def test_low_confidence_parse(self):
        """Test that low-confidence emails return None"""
        subject = "Random email"
        body = "This is just a random email with no event information."
        
        event, confidence = self.parser.parse(body, subject)
        assert confidence < 0.4
        assert event is None

class TestOllamaClient:
    """Test Ollama client functionality"""
    
    def setup_method(self):
        self.client = OllamaClient("http://localhost:11434", "llama3.1:8b")
    
    @patch('requests.Session.get')
    def test_health_check_success(self, mock_get):
        """Test successful health check"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        assert self.client.health_check() is True
        mock_get.assert_called_once()
    
    @patch('requests.Session.get')
    def test_health_check_failure(self, mock_get):
        """Test failed health check"""
        mock_get.side_effect = Exception("Connection failed")
        
        assert self.client.health_check() is False
    
    @patch('requests.Session.post')
    def test_generate_success(self, mock_post):
        """Test successful generation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "response": '{"title": "Test Event", "start_date": "2024-03-15"}'
        }
        mock_post.return_value = mock_response
        
        result = self.client.generate("Test prompt")
        
        assert "response" in result
        mock_post.assert_called_once()
    
    @patch('requests.Session.post')
    def test_generate_timeout(self, mock_post):
        """Test generation timeout"""
        mock_post.side_effect = Exception("Timeout")
        
        with pytest.raises(RuntimeError):
            self.client.generate("Test prompt")

class TestEventParser:
    """Test main event parser functionality"""
    
    def setup_method(self):
        # Mock environment variables
        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key',
            'OLLAMA_BASE_URL': 'http://localhost:11434',
            'OLLAMA_MODEL': 'llama3.1:8b'
        }):
            self.parser = EventParser()
    
    @patch('parser.main.create_client')
    def test_initialization(self, mock_create_client):
        """Test parser initialization"""
        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key'
        }):
            parser = EventParser()
            assert parser.supabase_url == 'https://test.supabase.co'
            assert parser.supabase_key == 'test-key'
            mock_create_client.assert_called_once()
    
    def test_missing_env_vars(self):
        """Test initialization with missing environment variables"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError):
                EventParser()
    
    @pytest.mark.asyncio
    async def test_get_unprocessed_emails(self):
        """Test fetching unprocessed emails"""
        # Mock Supabase response
        mock_response = Mock()
        mock_response.data = [
            {
                'id': '1',
                'user_id': 'user1',
                'raw_body': 'Test email body',
                'subject': 'Test Subject',
                'from_email': 'test@example.com',
                'received_at': '2024-03-15T10:00:00Z',
                'processed': False
            }
        ]
        
        self.parser.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        emails = await self.parser._get_unprocessed_emails()
        
        assert len(emails) == 1
        assert emails[0].id == '1'
        assert emails[0].subject == 'Test Subject'
    
    @pytest.mark.asyncio
    async def test_find_child_id(self):
        """Test finding child ID from email content"""
        # Mock children response
        mock_response = Mock()
        mock_response.data = [
            {'id': 'child1', 'name': 'Emma'},
            {'id': 'child2', 'name': 'Oliver'}
        ]
        
        self.parser.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        child_id = await self.parser._find_child_id('user1', 'Emma\'s soccer practice', 'Practice for Emma tomorrow')
        
        assert child_id == 'child1'
    
    @pytest.mark.asyncio
    async def test_insert_event(self):
        """Test event insertion"""
        email = EmailRecord(
            id='email1',
            user_id='user1',
            raw_body='Test body',
            subject='Test Subject',
            from_email='test@example.com',
            received_at='2024-03-15T10:00:00Z'
        )
        
        event = ParsedEvent(
            title='Test Event',
            start_ts='2024-03-15T15:00:00',
            end_ts='2024-03-15T16:00:00',
            location='Test Location',
            prep_items=['item1', 'item2'],
            confidence=0.8,
            child_id='child1'
        )
        
        # Mock Supabase insert
        mock_insert = Mock()
        self.parser.supabase.table.return_value.insert.return_value.execute = mock_insert
        
        await self.parser._insert_event(email, event)
        
        # Verify insert was called
        self.parser.supabase.table.assert_called_with('events')
    
    @pytest.mark.asyncio
    @patch('parser.main.EventParser._parse_with_ollama')
    async def test_process_email_with_ollama_fallback(self, mock_ollama_parse):
        """Test email processing with Ollama fallback"""
        # Setup mocks
        email = EmailRecord(
            id='email1',
            user_id='user1',
            raw_body='Complex email that regex cannot parse well',
            subject='Unclear Event',
            from_email='test@example.com',
            received_at='2024-03-15T10:00:00Z'
        )
        
        # Mock existing event check (no existing event)
        mock_existing = Mock()
        mock_existing.data = []
        self.parser.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_existing
        
        # Mock Ollama parsing
        mock_ollama_parse.return_value = ParsedEvent(
            title='Parsed Event',
            start_ts='2024-03-15T15:00:00',
            end_ts='2024-03-15T16:00:00',
            confidence=0.8
        )
        
        # Mock other methods
        self.parser._find_child_id = AsyncMock(return_value='child1')
        self.parser._insert_event = AsyncMock()
        self.parser._mark_email_processed = AsyncMock()
        
        await self.parser._process_email(email)
        
        # Verify Ollama was called due to low regex confidence
        mock_ollama_parse.assert_called_once_with(email)
        self.parser._insert_event.assert_called_once()
        self.parser._mark_email_processed.assert_called_once_with('email1', success=True)
    
    @pytest.mark.asyncio
    async def test_parse_with_ollama(self):
        """Test parsing with Ollama"""
        email = EmailRecord(
            id='email1',
            user_id='user1',
            raw_body='Soccer practice tomorrow at 3 PM',
            subject='Soccer Practice',
            from_email='test@example.com',
            received_at='2024-03-15T10:00:00Z'
        )
        
        # Mock Ollama response
        ollama_response = {
            "response": json.dumps({
                "title": "Soccer Practice",
                "start_date": "2024-03-16",
                "start_time": "15:00",
                "end_date": "2024-03-16",
                "end_time": "16:00",
                "location": "Sports Center",
                "prep_items": ["cleats", "water bottle"]
            })
        }
        
        self.parser.ollama.generate = Mock(return_value=ollama_response)
        
        result = await self.parser._parse_with_ollama(email)
        
        assert result is not None
        assert result.title == "Soccer Practice"
        assert "2024-03-16T15:00" in result.start_ts
        assert result.location == "Sports Center"
        assert result.prep_items == ["cleats", "water bottle"]
        assert result.confidence == 0.8

class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_duplicate_email_handling(self):
        """Test that duplicate emails don't create duplicate events"""
        with patch.dict(os.environ, {
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key'
        }):
            parser = EventParser()
            
            email = EmailRecord(
                id='email1',
                user_id='user1',
                raw_body='Test body',
                subject='Test Subject',
                from_email='test@example.com',
                received_at='2024-03-15T10:00:00Z'
            )
            
            # Mock existing event
            mock_existing = Mock()
            mock_existing.data = [{'id': 'event1'}]
            parser.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_existing
            
            # Mock mark processed
            parser._mark_email_processed = AsyncMock()
            
            await parser._process_email(email)
            
            # Should mark as processed without creating new event
            parser._mark_email_processed.assert_called_once_with('email1', success=True)
    
    def test_sample_fixture_parsing(self):
        """Test parsing of sample fixture email"""
        parser = RegexParser()
        
        subject = "Emma's School Science Fair - March 20th"
        body = """
        Dear Parents,
        
        The annual Science Fair will be held on March 20, 2024 from 2:00 PM to 5:00 PM.
        Location: School Gymnasium
        
        Please bring: Camera for photos, comfortable walking shoes
        
        We look forward to seeing you there!
        
        Best regards,
        Science Department
        """
        
        event, confidence = parser.parse(body, subject)
        
        assert event is not None
        assert "Science Fair" in event.title
        assert "2024-03-20" in event.start_ts
        assert event.location == "School Gymnasium"
        assert event.prep_items is not None
        assert "Camera for photos" in event.prep_items
        assert confidence >= 0.7

if __name__ == "__main__":
    pytest.main([__file__, "-v"])