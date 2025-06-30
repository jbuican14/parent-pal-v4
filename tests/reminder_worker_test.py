#!/usr/bin/env python3
"""
Reminder Worker Tests

Comprehensive test suite for the reminder worker service including
Google Calendar integration, push notifications, and database operations.
"""

import pytest
import json
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
import sys
import os

# Add worker to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from worker.main import (
    ReminderWorker,
    EventRecord,
    ReminderRecord,
    GoogleCalendarError,
    PushNotificationError
)

class TestReminderWorker:
    """Test reminder worker functionality"""
    
    def setup_method(self):
        # Mock environment variables
        with patch.dict(os.environ, {
            'EXPO_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key',
            'GOOGLE_CLIENT_EMAIL': 'test@example.com',
            'GOOGLE_PRIVATE_KEY': 'test-key',
            'GOOGLE_PROJECT_ID': 'test-project',
            'EXPO_ACCESS_TOKEN': 'test-token'
        }):
            self.worker = ReminderWorker()
    
    @patch('worker.main.create_client')
    def test_initialization(self, mock_create_client):
        """Test worker initialization"""
        with patch.dict(os.environ, {
            'EXPO_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key',
            'GOOGLE_CLIENT_EMAIL': 'test@example.com',
            'GOOGLE_PRIVATE_KEY': 'test-key',
            'GOOGLE_PROJECT_ID': 'test-project',
            'EXPO_ACCESS_TOKEN': 'test-token'
        }):
            worker = ReminderWorker()
            assert worker.supabase is not None
            assert worker.push_client is not None
            mock_create_client.assert_called_once()
    
    def test_missing_env_vars(self):
        """Test initialization with missing environment variables"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError):
                ReminderWorker()
    
    @pytest.mark.asyncio
    async def test_get_pending_events(self):
        """Test fetching pending events"""
        # Mock Supabase response
        mock_response = Mock()
        mock_response.data = [
            {
                'id': 'event1',
                'user_id': 'user1',
                'child_id': 'child1',
                'title': 'Soccer Practice',
                'start_ts': '2024-03-15T15:00:00Z',
                'end_ts': '2024-03-15T16:00:00Z',
                'location': 'Sports Center',
                'prep_items': ['cleats', 'water bottle'],
                'status': 'pending',
                'google_calendar_id': None
            }
        ]
        
        self.worker.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        events = await self.worker._get_pending_events()
        
        assert len(events) == 1
        assert events[0].id == 'event1'
        assert events[0].title == 'Soccer Practice'
        assert events[0].status == 'pending'
    
    @pytest.mark.asyncio
    async def test_create_reminders(self):
        """Test creating reminder notifications"""
        # Create test event
        future_time = datetime.utcnow() + timedelta(days=2)
        event = EventRecord(
            id='event1',
            user_id='user1',
            child_id='child1',
            title='Soccer Practice',
            start_ts=future_time.isoformat() + 'Z',
            end_ts=(future_time + timedelta(hours=1)).isoformat() + 'Z',
            location='Sports Center',
            prep_items=['cleats'],
            status='pending'
        )
        
        # Mock user response
        mock_user_response = Mock()
        mock_user_response.data = [{'expo_push_token': 'ExponentPushToken[test]'}]
        
        # Mock upsert response
        mock_upsert = Mock()
        
        self.worker.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_user_response
        self.worker.supabase.table.return_value.upsert.return_value.execute = mock_upsert
        
        await self.worker._create_reminders(event)
        
        # Verify upsert was called
        self.worker.supabase.table.assert_called()
    
    @pytest.mark.asyncio
    async def test_sync_to_google_calendar(self):
        """Test Google Calendar synchronization"""
        event = EventRecord(
            id='event1',
            user_id='user1',
            child_id=None,
            title='Test Event',
            start_ts='2024-03-15T15:00:00Z',
            end_ts='2024-03-15T16:00:00Z',
            location='Test Location',
            prep_items=['item1'],
            status='pending'
        )
        
        # Mock calendar service
        mock_service = Mock()
        mock_events = Mock()
        mock_insert = Mock()
        mock_insert.execute.return_value = {'id': 'cal_event_123'}
        
        mock_events.insert.return_value = mock_insert
        mock_service.events.return_value = mock_events
        
        with patch.object(self.worker, '_get_user_calendar_service', return_value=mock_service):
            calendar_id = await self.worker._sync_to_google_calendar(event)
            
            assert calendar_id == 'cal_event_123'
            mock_events.insert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_sync_to_google_calendar_no_service(self):
        """Test calendar sync when no service available"""
        event = EventRecord(
            id='event1',
            user_id='user1',
            child_id=None,
            title='Test Event',
            start_ts='2024-03-15T15:00:00Z',
            end_ts='2024-03-15T16:00:00Z',
            location=None,
            prep_items=None,
            status='pending'
        )
        
        with patch.object(self.worker, '_get_user_calendar_service', return_value=None):
            calendar_id = await self.worker._sync_to_google_calendar(event)
            
            assert calendar_id is None
    
    @pytest.mark.asyncio
    async def test_get_pending_reminders(self):
        """Test fetching pending reminders"""
        # Mock Supabase response
        mock_response = Mock()
        mock_response.data = [
            {
                'id': 'reminder1',
                'event_id': 'event1',
                'user_id': 'user1',
                'notify_at_ts': '2024-03-15T14:00:00Z',
                'message': 'Reminder: Soccer Practice starts in 1 hour',
                'push_token': 'ExponentPushToken[test]',
                'sent_at_ts': None,
                'status': 'pending',
                'retry_count': 0
            }
        ]
        
        self.worker.supabase.table.return_value.select.return_value.lte.return_value.is_.return_value.eq.return_value.execute.return_value = mock_response
        
        reminders = await self.worker._get_pending_reminders()
        
        assert len(reminders) == 1
        assert reminders[0].id == 'reminder1'
        assert reminders[0].status == 'pending'
    
    @pytest.mark.asyncio
    async def test_send_push_notification_success(self):
        """Test successful push notification sending"""
        reminder = ReminderRecord(
            id='reminder1',
            event_id='event1',
            user_id='user1',
            notify_at_ts='2024-03-15T14:00:00Z',
            message='Test reminder',
            push_token='ExponentPushToken[test]',
            sent_at_ts=None,
            status='pending',
            retry_count=0
        )
        
        # Mock successful push response
        mock_response = Mock()
        mock_response.is_success.return_value = True
        
        with patch.object(self.worker.push_client, 'publish', return_value=mock_response):
            with patch.object(self.worker, '_mark_reminder_sent', new_callable=AsyncMock) as mock_mark:
                await self.worker._send_push_notification(reminder)
                
                mock_mark.assert_called_once_with('reminder1')
    
    @pytest.mark.asyncio
    async def test_send_push_notification_no_token(self):
        """Test push notification with no token"""
        reminder = ReminderRecord(
            id='reminder1',
            event_id='event1',
            user_id='user1',
            notify_at_ts='2024-03-15T14:00:00Z',
            message='Test reminder',
            push_token=None,
            sent_at_ts=None,
            status='pending',
            retry_count=0
        )
        
        with patch.object(self.worker, '_mark_reminder_sent', new_callable=AsyncMock) as mock_mark:
            await self.worker._send_push_notification(reminder)
            
            mock_mark.assert_called_once_with('reminder1', 'No push token')
    
    @pytest.mark.asyncio
    async def test_handle_push_failure_max_retries(self):
        """Test push failure handling at max retries"""
        reminder = ReminderRecord(
            id='reminder1',
            event_id='event1',
            user_id='user1',
            notify_at_ts='2024-03-15T14:00:00Z',
            message='Test reminder',
            push_token='ExponentPushToken[test]',
            sent_at_ts=None,
            status='pending',
            retry_count=4  # One less than max
        )
        
        # Mock update response
        mock_update = Mock()
        self.worker.supabase.table.return_value.update.return_value.eq.return_value.execute = mock_update
        
        await self.worker._handle_push_failure(reminder, 'Test error')
        
        # Should mark as failed since retry_count + 1 = 5 (max retries)
        self.worker.supabase.table.assert_called()
    
    @pytest.mark.asyncio
    async def test_handle_push_failure_retry(self):
        """Test push failure handling with retry"""
        reminder = ReminderRecord(
            id='reminder1',
            event_id='event1',
            user_id='user1',
            notify_at_ts='2024-03-15T14:00:00Z',
            message='Test reminder',
            push_token='ExponentPushToken[test]',
            sent_at_ts=None,
            status='pending',
            retry_count=1
        )
        
        # Mock update response
        mock_update = Mock()
        self.worker.supabase.table.return_value.update.return_value.eq.return_value.execute = mock_update
        
        await self.worker._handle_push_failure(reminder, 'Test error')
        
        # Should schedule retry since retry_count + 1 = 2 < 5
        self.worker.supabase.table.assert_called()
    
    @pytest.mark.asyncio
    async def test_mark_event_synced(self):
        """Test marking event as synced"""
        # Mock update response
        mock_update = Mock()
        self.worker.supabase.table.return_value.update.return_value.eq.return_value.execute = mock_update
        
        await self.worker._mark_event_synced('event1', 'cal_event_123')
        
        self.worker.supabase.table.assert_called_with('events')
    
    @pytest.mark.asyncio
    async def test_mark_reminder_sent(self):
        """Test marking reminder as sent"""
        # Mock update response
        mock_update = Mock()
        self.worker.supabase.table.return_value.update.return_value.eq.return_value.execute = mock_update
        
        await self.worker._mark_reminder_sent('reminder1')
        
        self.worker.supabase.table.assert_called_with('reminders')

class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_process_events_workflow(self):
        """Test complete event processing workflow"""
        with patch.dict(os.environ, {
            'EXPO_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key',
            'GOOGLE_CLIENT_EMAIL': 'test@example.com',
            'GOOGLE_PRIVATE_KEY': 'test-key',
            'GOOGLE_PROJECT_ID': 'test-project',
            'EXPO_ACCESS_TOKEN': 'test-token'
        }):
            worker = ReminderWorker()
            
            # Mock all dependencies
            with patch.object(worker, '_get_pending_events', new_callable=AsyncMock) as mock_get_events:
                with patch.object(worker, '_process_single_event', new_callable=AsyncMock) as mock_process:
                    
                    # Setup mock data
                    mock_event = EventRecord(
                        id='event1',
                        user_id='user1',
                        child_id=None,
                        title='Test Event',
                        start_ts='2024-03-15T15:00:00Z',
                        end_ts='2024-03-15T16:00:00Z',
                        location=None,
                        prep_items=None,
                        status='pending'
                    )
                    
                    mock_get_events.return_value = [mock_event]
                    
                    await worker.process_events()
                    
                    mock_get_events.assert_called_once()
                    mock_process.assert_called_once_with(mock_event)
    
    @pytest.mark.asyncio
    async def test_process_push_notifications_workflow(self):
        """Test complete push notification workflow"""
        with patch.dict(os.environ, {
            'EXPO_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-key',
            'GOOGLE_CLIENT_EMAIL': 'test@example.com',
            'GOOGLE_PRIVATE_KEY': 'test-key',
            'GOOGLE_PROJECT_ID': 'test-project',
            'EXPO_ACCESS_TOKEN': 'test-token'
        }):
            worker = ReminderWorker()
            
            # Mock all dependencies
            with patch.object(worker, '_get_pending_reminders', new_callable=AsyncMock) as mock_get_reminders:
                with patch.object(worker, '_send_push_notification', new_callable=AsyncMock) as mock_send:
                    
                    # Setup mock data
                    mock_reminder = ReminderRecord(
                        id='reminder1',
                        event_id='event1',
                        user_id='user1',
                        notify_at_ts='2024-03-15T14:00:00Z',
                        message='Test reminder',
                        push_token='ExponentPushToken[test]',
                        sent_at_ts=None,
                        status='pending',
                        retry_count=0
                    )
                    
                    mock_get_reminders.return_value = [mock_reminder]
                    
                    await worker.process_push_notifications()
                    
                    mock_get_reminders.assert_called_once()
                    mock_send.assert_called_once_with(mock_reminder)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])