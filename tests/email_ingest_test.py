#!/usr/bin/env python3
"""
Email Ingest Service Tests

Comprehensive test suite for the email ingest service including
JWT verification, Gmail API integration, and database operations.
"""

import pytest
import json
import base64
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import jwt
import sys
import os

# Add main module to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import (
    handle_pubsub,
    verify_pubsub_jwt,
    extract_pubsub_data,
    fetch_email_content,
    store_email,
    find_user_id,
    JWTVerificationError,
    GmailAPIError,
    DatabaseError,
    EmailIngestError
)

class TestJWTVerification:
    """Test JWT verification functionality"""
    
    def test_verify_valid_jwt(self):
        """Test verification of valid JWT"""
        # Create mock request with valid JWT
        mock_request = Mock()
        
        # Create a valid JWT payload
        payload = {
            'iss': 'accounts.google.com',
            'aud': 'test-project-id',
            'exp': int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
            'sub': 'test-user'
        }
        
        # Create JWT token (without signature verification for testing)
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        mock_request.headers = {'Authorization': f'Bearer {token}'}
        
        with patch.dict(os.environ, {'GOOGLE_PROJECT_ID': 'test-project-id'}):
            result = verify_pubsub_jwt(mock_request)
            
        assert result['iss'] == 'accounts.google.com'
        assert result['aud'] == 'test-project-id'
        assert result['sub'] == 'test-user'
    
    def test_verify_missing_auth_header(self):
        """Test JWT verification with missing auth header"""
        mock_request = Mock()
        mock_request.headers = {}
        
        with pytest.raises(JWTVerificationError, match="Missing or invalid Authorization header"):
            verify_pubsub_jwt(mock_request)
    
    def test_verify_invalid_bearer_format(self):
        """Test JWT verification with invalid bearer format"""
        mock_request = Mock()
        mock_request.headers = {'Authorization': 'Invalid token'}
        
        with pytest.raises(JWTVerificationError, match="Missing or invalid Authorization header"):
            verify_pubsub_jwt(mock_request)
    
    def test_verify_expired_jwt(self):
        """Test JWT verification with expired token"""
        mock_request = Mock()
        
        # Create expired JWT payload
        payload = {
            'iss': 'accounts.google.com',
            'aud': 'test-project-id',
            'exp': int((datetime.utcnow() - timedelta(hours=1)).timestamp()),
            'sub': 'test-user'
        }
        
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        mock_request.headers = {'Authorization': f'Bearer {token}'}
        
        with patch.dict(os.environ, {'GOOGLE_PROJECT_ID': 'test-project-id'}):
            with pytest.raises(JWTVerificationError, match="Token expired"):
                verify_pubsub_jwt(mock_request)
    
    def test_verify_invalid_issuer(self):
        """Test JWT verification with invalid issuer"""
        mock_request = Mock()
        
        payload = {
            'iss': 'invalid-issuer.com',
            'aud': 'test-project-id',
            'exp': int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
            'sub': 'test-user'
        }
        
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        mock_request.headers = {'Authorization': f'Bearer {token}'}
        
        with patch.dict(os.environ, {'GOOGLE_PROJECT_ID': 'test-project-id'}):
            with pytest.raises(JWTVerificationError, match="Invalid issuer"):
                verify_pubsub_jwt(mock_request)

class TestPubSubDataExtraction:
    """Test Pub/Sub data extraction"""
    
    def test_extract_valid_pubsub_data(self):
        """Test extraction of valid Pub/Sub data"""
        # Create mock Pub/Sub message
        pubsub_data = {
            'historyId': '12345',
            'emailAddress': 'test@example.com'
        }
        
        encoded_data = base64.b64encode(json.dumps(pubsub_data).encode()).decode()
        
        mock_request = Mock()
        mock_request.get_json.return_value = {
            'message': {
                'data': encoded_data
            }
        }
        
        history_id, email_address = extract_pubsub_data(mock_request)
        
        assert history_id == '12345'
        assert email_address == 'test@example.com'
    
    def test_extract_missing_json(self):
        """Test extraction with missing JSON data"""
        mock_request = Mock()
        mock_request.get_json.return_value = None
        
        with pytest.raises(EmailIngestError, match="No JSON data in request"):
            extract_pubsub_data(mock_request)
    
    def test_extract_missing_message(self):
        """Test extraction with missing message"""
        mock_request = Mock()
        mock_request.get_json.return_value = {}
        
        with pytest.raises(EmailIngestError, match="No message in Pub/Sub data"):
            extract_pubsub_data(mock_request)
    
    def test_extract_missing_data(self):
        """Test extraction with missing data field"""
        mock_request = Mock()
        mock_request.get_json.return_value = {
            'message': {}
        }
        
        with pytest.raises(EmailIngestError, match="No data in Pub/Sub message"):
            extract_pubsub_data(mock_request)
    
    def test_extract_invalid_base64(self):
        """Test extraction with invalid base64 data"""
        mock_request = Mock()
        mock_request.get_json.return_value = {
            'message': {
                'data': 'invalid-base64!'
            }
        }
        
        with pytest.raises(EmailIngestError, match="Failed to decode Pub/Sub data"):
            extract_pubsub_data(mock_request)
    
    def test_extract_missing_history_id(self):
        """Test extraction with missing historyId"""
        pubsub_data = {
            'emailAddress': 'test@example.com'
        }
        
        encoded_data = base64.b64encode(json.dumps(pubsub_data).encode()).decode()
        
        mock_request = Mock()
        mock_request.get_json.return_value = {
            'message': {
                'data': encoded_data
            }
        }
        
        with pytest.raises(EmailIngestError, match="Missing historyId in Pub/Sub data"):
            extract_pubsub_data(mock_request)

class TestGmailAPI:
    """Test Gmail API integration"""
    
    @patch('main.get_gmail_service')
    def test_fetch_email_content_success(self, mock_get_service):
        """Test successful email content fetching"""
        # Mock Gmail service
        mock_service = Mock()
        mock_get_service.return_value = mock_service
        
        # Mock history response
        mock_history = Mock()
        mock_history.execute.return_value = {
            'history': [{
                'messagesAdded': [{
                    'message': {'id': 'msg123'}
                }]
            }]
        }
        mock_service.users().history().list.return_value = mock_history
        
        # Mock message response
        raw_email = base64.urlsafe_b64encode(
            b"Subject: Test Email\nFrom: test@example.com\n\nTest body"
        ).decode()
        
        mock_message = Mock()
        mock_message.execute.return_value = {
            'raw': raw_email
        }
        mock_service.users().messages().get.return_value = mock_message
        
        raw_body, headers = fetch_email_content('test@example.com', '12345')
        
        assert 'Subject: Test Email' in raw_body
        assert headers.get('Subject') == 'Test Email'
        assert headers.get('From') == 'test@example.com'
    
    @patch('main.get_gmail_service')
    def test_fetch_email_content_no_history(self, mock_get_service):
        """Test email fetching with no history found"""
        mock_service = Mock()
        mock_get_service.return_value = mock_service
        
        # Mock empty history response
        mock_history = Mock()
        mock_history.execute.return_value = {'history': []}
        mock_service.users().history().list.return_value = mock_history
        
        with pytest.raises(GmailAPIError, match="No history found"):
            fetch_email_content('test@example.com', '12345')

class TestDatabaseOperations:
    """Test database operations"""
    
    @patch('psycopg.connect')
    def test_find_user_id_success(self, mock_connect):
        """Test successful user ID lookup"""
        # Mock database connection and cursor
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = ('user123',)
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value.__enter__.return_value = mock_conn
        
        user_id = find_user_id('test@example.com')
        
        assert user_id == 'user123'
        mock_cursor.execute.assert_called_once()
    
    @patch('psycopg.connect')
    def test_find_user_id_not_found(self, mock_connect):
        """Test user ID lookup when user not found"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = None
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value.__enter__.return_value = mock_conn
        
        user_id = find_user_id('nonexistent@example.com')
        
        assert user_id is None
    
    @patch('psycopg.connect')
    def test_store_email_success(self, mock_connect):
        """Test successful email storage"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = ('email123',)  # Indicates successful insert
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value.__enter__.return_value = mock_conn
        
        headers = {
            'Subject': 'Test Email',
            'From': 'test@example.com'
        }
        
        inserted = store_email('user123', 'raw email body', headers, '12345')
        
        assert inserted is True
        mock_cursor.execute.assert_called_once()
        mock_conn.commit.assert_called_once()
    
    @patch('psycopg.connect')
    def test_store_email_duplicate(self, mock_connect):
        """Test email storage with duplicate (idempotent)"""
        mock_conn = Mock()
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = None  # Indicates conflict (no insert)
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value.__enter__.return_value = mock_conn
        
        headers = {
            'Subject': 'Test Email',
            'From': 'test@example.com'
        }
        
        inserted = store_email('user123', 'raw email body', headers, '12345')
        
        assert inserted is False

class TestMainHandler:
    """Test main handler function"""
    
    @patch('main.store_email')
    @patch('main.fetch_email_content')
    @patch('main.find_user_id')
    @patch('main.extract_pubsub_data')
    @patch('main.verify_pubsub_jwt')
    def test_handle_pubsub_success(self, mock_verify_jwt, mock_extract_data, 
                                   mock_find_user, mock_fetch_email, mock_store_email):
        """Test successful Pub/Sub handling"""
        # Setup mocks
        mock_verify_jwt.return_value = {'sub': 'test-user'}
        mock_extract_data.return_value = ('12345', 'test@example.com')
        mock_find_user.return_value = 'user123'
        mock_fetch_email.return_value = ('raw email', {'Subject': 'Test'})
        mock_store_email.return_value = True
        
        mock_request = Mock()
        
        response = handle_pubsub(mock_request)
        
        assert response == ("", 204)
        mock_verify_jwt.assert_called_once_with(mock_request)
        mock_extract_data.assert_called_once_with(mock_request)
        mock_find_user.assert_called_once_with('test@example.com')
        mock_fetch_email.assert_called_once_with('test@example.com', '12345')
        mock_store_email.assert_called_once()
    
    @patch('main.verify_pubsub_jwt')
    def test_handle_pubsub_jwt_error(self, mock_verify_jwt):
        """Test Pub/Sub handling with JWT error"""
        mock_verify_jwt.side_effect = JWTVerificationError("Invalid token")
        
        mock_request = Mock()
        
        response = handle_pubsub(mock_request)
        
        assert response[1] == 400
        assert "Invalid JWT" in response[0]
    
    @patch('main.find_user_id')
    @patch('main.extract_pubsub_data')
    @patch('main.verify_pubsub_jwt')
    def test_handle_pubsub_user_not_found(self, mock_verify_jwt, mock_extract_data, mock_find_user):
        """Test Pub/Sub handling when user not found"""
        mock_verify_jwt.return_value = {'sub': 'test-user'}
        mock_extract_data.return_value = ('12345', 'test@example.com')
        mock_find_user.return_value = None
        
        mock_request = Mock()
        
        response = handle_pubsub(mock_request)
        
        assert response == ("User not found", 404)
    
    @patch('main.extract_pubsub_data')
    @patch('main.verify_pubsub_jwt')
    def test_handle_pubsub_extraction_error(self, mock_verify_jwt, mock_extract_data):
        """Test Pub/Sub handling with data extraction error"""
        mock_verify_jwt.return_value = {'sub': 'test-user'}
        mock_extract_data.side_effect = EmailIngestError("Invalid data")
        
        mock_request = Mock()
        
        response = handle_pubsub(mock_request)
        
        assert response[1] == 400
        assert "Bad request" in response[0]

class TestIntegration:
    """Integration tests"""
    
    def test_sample_pubsub_message(self):
        """Test processing of sample Pub/Sub message"""
        # Create realistic Pub/Sub message
        pubsub_data = {
            'historyId': '123456789',
            'emailAddress': 'parent@example.com'
        }
        
        encoded_data = base64.b64encode(json.dumps(pubsub_data).encode()).decode()
        
        mock_request = Mock()
        mock_request.get_json.return_value = {
            'message': {
                'data': encoded_data,
                'messageId': 'msg123',
                'publishTime': '2024-01-01T12:00:00Z'
            }
        }
        
        history_id, email_address = extract_pubsub_data(mock_request)
        
        assert history_id == '123456789'
        assert email_address == 'parent@example.com'
    
    def test_email_parsing(self):
        """Test email parsing functionality"""
        raw_email = """Subject: Soccer Practice Tomorrow
From: coach@school.com
To: parent@example.com
Date: Mon, 1 Jan 2024 12:00:00 +0000

Hi Parents,

Soccer practice is tomorrow at 3 PM at the school field.
Please bring water bottles and cleats.

Thanks,
Coach Smith"""
        
        import email
        email_msg = email.message_from_string(raw_email)
        headers = dict(email_msg.items())
        
        assert headers['Subject'] == 'Soccer Practice Tomorrow'
        assert headers['From'] == 'coach@school.com'
        assert 'Soccer practice is tomorrow' in email_msg.get_payload()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])