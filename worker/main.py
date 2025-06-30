#!/usr/bin/env python3
"""
Reminder Worker Service

Processes events to create Google Calendar entries and schedule push notifications.
Runs as a scheduled job to maintain calendar sync and notification delivery.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import asyncio
import traceback

from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from supabase import create_client, Client
import psycopg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_CLIENT_EMAIL = os.getenv('GOOGLE_CLIENT_EMAIL')
GOOGLE_PRIVATE_KEY = os.getenv('GOOGLE_PRIVATE_KEY', '').replace('\\n', '\n')
GOOGLE_PROJECT_ID = os.getenv('GOOGLE_PROJECT_ID')
EXPO_ACCESS_TOKEN = os.getenv('EXPO_ACCESS_TOKEN')

# Validate required environment variables
REQUIRED_ENV_VARS = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_PROJECT_ID',
    'EXPO_ACCESS_TOKEN'
]

for var in REQUIRED_ENV_VARS:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

@dataclass
class EventRecord:
    """Event record from database"""
    id: str
    user_id: str
    child_id: Optional[str]
    title: str
    start_ts: str
    end_ts: str
    location: Optional[str]
    prep_items: Optional[List[str]]
    status: str
    google_calendar_id: Optional[str] = None

@dataclass
class ReminderRecord:
    """Reminder record for notifications"""
    id: str
    event_id: str
    user_id: str
    notify_at_ts: str
    message: str
    push_token: Optional[str]
    sent_at_ts: Optional[str]
    status: str
    retry_count: int = 0

class GoogleCalendarError(Exception):
    """Google Calendar operation failed"""
    pass

class PushNotificationError(Exception):
    """Push notification operation failed"""
    pass

class ReminderWorker:
    """Main reminder worker service"""
    
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        self.push_client = PushClient()
        
        # Create service account credentials for Google Calendar
        self.service_credentials = self._create_service_credentials()
    
    def _create_service_credentials(self) -> service_account.Credentials:
        """Create Google service account credentials"""
        try:
            credentials_info = {
                "type": "service_account",
                "project_id": GOOGLE_PROJECT_ID,
                "private_key_id": "",
                "private_key": GOOGLE_PRIVATE_KEY,
                "client_email": GOOGLE_CLIENT_EMAIL,
                "client_id": "",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
            }
            
            return service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
        except Exception as e:
            logger.error(f"Failed to create service credentials: {e}")
            raise GoogleCalendarError(f"Failed to create service credentials: {e}")
    
    def _get_user_calendar_service(self, user_id: str):
        """Get Calendar service for specific user using their OAuth token"""
        try:
            # Get user's Google refresh token
            response = self.supabase.table('users').select('google_refresh_token').eq('id', user_id).execute()
            
            if not response.data:
                logger.warning(f"No user found with ID {user_id}")
                return None
            
            refresh_token = response.data[0].get('google_refresh_token')
            if not refresh_token:
                logger.warning(f"No Google refresh token for user {user_id}")
                return None
            
            # Create user credentials from refresh token
            credentials = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            
            # Refresh the token if needed
            if not credentials.valid:
                credentials.refresh(Request())
            
            # Build Calendar service
            return build('calendar', 'v3', credentials=credentials)
            
        except Exception as e:
            logger.error(f"Failed to get calendar service for user {user_id}: {e}")
            return None
    
    async def process_events(self) -> None:
        """Main processing loop - handle pending events"""
        logger.info("Starting event processing")
        
        try:
            # Get pending events
            pending_events = await self._get_pending_events()
            
            if not pending_events:
                logger.info("No pending events found")
                return
            
            logger.info(f"Processing {len(pending_events)} pending events")
            
            for event in pending_events:
                try:
                    await self._process_single_event(event)
                except Exception as e:
                    logger.error(f"Failed to process event {event.id}: {e}")
                    logger.error(traceback.format_exc())
                    # Continue processing other events
                    continue
            
            logger.info("Event processing completed")
            
        except Exception as e:
            logger.error(f"Event processing failed: {e}")
            logger.error(traceback.format_exc())
    
    async def _get_pending_events(self) -> List[EventRecord]:
        """Fetch events with status='pending'"""
        try:
            response = self.supabase.table('events').select('*').eq('status', 'pending').execute()
            
            events = []
            for row in response.data:
                events.append(EventRecord(
                    id=row['id'],
                    user_id=row['user_id'],
                    child_id=row.get('child_id'),
                    title=row['title'],
                    start_ts=row['start_ts'],
                    end_ts=row['end_ts'],
                    location=row.get('location'),
                    prep_items=row.get('prep_items'),
                    status=row['status'],
                    google_calendar_id=row.get('google_calendar_id')
                ))
            
            return events
            
        except Exception as e:
            logger.error(f"Failed to fetch pending events: {e}")
            raise
    
    async def _process_single_event(self, event: EventRecord) -> None:
        """Process a single event: create calendar entry and reminders"""
        logger.info(f"Processing event {event.id}: {event.title}")
        
        try:
            # Step 1: Create/update Google Calendar event
            calendar_event_id = await self._sync_to_google_calendar(event)
            
            # Step 2: Create reminder notifications
            await self._create_reminders(event)
            
            # Step 3: Mark event as synced
            await self._mark_event_synced(event.id, calendar_event_id)
            
            logger.info(f"Successfully processed event {event.id}")
            
        except Exception as e:
            logger.error(f"Failed to process event {event.id}: {e}")
            # Mark event as failed
            await self._mark_event_failed(event.id, str(e))
            raise
    
    async def _sync_to_google_calendar(self, event: EventRecord) -> Optional[str]:
        """Create or update Google Calendar event"""
        try:
            calendar_service = self._get_user_calendar_service(event.user_id)
            if not calendar_service:
                logger.warning(f"No calendar service available for user {event.user_id}")
                return None
            
            # Prepare calendar event data
            calendar_event = {
                'summary': event.title,
                'start': {
                    'dateTime': event.start_ts,
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': event.end_ts,
                    'timeZone': 'UTC',
                },
            }
            
            if event.location:
                calendar_event['location'] = event.location
            
            if event.prep_items:
                description = "Items to bring:\n" + "\n".join(f"• {item}" for item in event.prep_items)
                calendar_event['description'] = description
            
            # Check if event already exists in calendar
            if event.google_calendar_id:
                try:
                    # Update existing event
                    updated_event = calendar_service.events().update(
                        calendarId='primary',
                        eventId=event.google_calendar_id,
                        body=calendar_event
                    ).execute()
                    
                    logger.info(f"Updated calendar event {event.google_calendar_id}")
                    return updated_event['id']
                    
                except HttpError as e:
                    if e.resp.status == 404:
                        # Event not found, create new one
                        logger.warning(f"Calendar event {event.google_calendar_id} not found, creating new")
                    else:
                        raise GoogleCalendarError(f"Failed to update calendar event: {e}")
            
            # Create new calendar event
            created_event = calendar_service.events().insert(
                calendarId='primary',
                body=calendar_event
            ).execute()
            
            logger.info(f"Created calendar event {created_event['id']}")
            return created_event['id']
            
        except Exception as e:
            logger.error(f"Failed to sync event to Google Calendar: {e}")
            # Don't raise exception - calendar sync is optional
            return None
    
    async def _create_reminders(self, event: EventRecord) -> None:
        """Create reminder notifications for event"""
        try:
            start_time = datetime.fromisoformat(event.start_ts.replace('Z', '+00:00'))
            
            # Define reminder times: 24h, 3h, 30min before event
            reminder_times = [
                (start_time - timedelta(hours=24), "24 hours"),
                (start_time - timedelta(hours=3), "3 hours"),
                (start_time - timedelta(minutes=30), "30 minutes"),
            ]
            
            # Get user's push token
            user_response = self.supabase.table('users').select('expo_push_token').eq('id', event.user_id).execute()
            push_token = None
            if user_response.data:
                push_token = user_response.data[0].get('expo_push_token')
            
            # Create reminder records
            reminders_to_insert = []
            for notify_time, time_desc in reminder_times:
                # Skip reminders that are in the past
                if notify_time <= datetime.utcnow():
                    continue
                
                message = f"Reminder: {event.title} starts in {time_desc}"
                if event.location:
                    message += f" at {event.location}"
                
                reminders_to_insert.append({
                    'event_id': event.id,
                    'user_id': event.user_id,
                    'notify_at_ts': notify_time.isoformat(),
                    'message': message,
                    'push_token': push_token,
                    'status': 'pending',
                    'retry_count': 0
                })
            
            if reminders_to_insert:
                # Insert reminders with conflict handling (idempotent)
                self.supabase.table('reminders').upsert(
                    reminders_to_insert,
                    on_conflict='event_id,notify_at_ts'
                ).execute()
                
                logger.info(f"Created {len(reminders_to_insert)} reminders for event {event.id}")
            else:
                logger.info(f"No future reminders needed for event {event.id}")
                
        except Exception as e:
            logger.error(f"Failed to create reminders for event {event.id}: {e}")
            raise
    
    async def _mark_event_synced(self, event_id: str, calendar_event_id: Optional[str]) -> None:
        """Mark event as synced"""
        try:
            update_data = {'status': 'synced'}
            if calendar_event_id:
                update_data['google_calendar_id'] = calendar_event_id
            
            self.supabase.table('events').update(update_data).eq('id', event_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to mark event {event_id} as synced: {e}")
            raise
    
    async def _mark_event_failed(self, event_id: str, error_message: str) -> None:
        """Mark event as failed"""
        try:
            self.supabase.table('events').update({
                'status': 'failed',
                'error_message': error_message
            }).eq('id', event_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to mark event {event_id} as failed: {e}")
    
    async def process_push_notifications(self) -> None:
        """Process pending push notifications"""
        logger.info("Starting push notification processing")
        
        try:
            # Get pending reminders
            pending_reminders = await self._get_pending_reminders()
            
            if not pending_reminders:
                logger.info("No pending reminders found")
                return
            
            logger.info(f"Processing {len(pending_reminders)} pending reminders")
            
            for reminder in pending_reminders:
                try:
                    await self._send_push_notification(reminder)
                except Exception as e:
                    logger.error(f"Failed to send reminder {reminder.id}: {e}")
                    await self._handle_push_failure(reminder, str(e))
                    continue
            
            logger.info("Push notification processing completed")
            
        except Exception as e:
            logger.error(f"Push notification processing failed: {e}")
            logger.error(traceback.format_exc())
    
    async def _get_pending_reminders(self) -> List[ReminderRecord]:
        """Get reminders that need to be sent"""
        try:
            now = datetime.utcnow().isoformat()
            
            response = self.supabase.table('reminders').select('*').lte(
                'notify_at_ts', now
            ).is_('sent_at_ts', 'null').eq('status', 'pending').execute()
            
            reminders = []
            for row in response.data:
                reminders.append(ReminderRecord(
                    id=row['id'],
                    event_id=row['event_id'],
                    user_id=row['user_id'],
                    notify_at_ts=row['notify_at_ts'],
                    message=row['message'],
                    push_token=row.get('push_token'),
                    sent_at_ts=row.get('sent_at_ts'),
                    status=row['status'],
                    retry_count=row.get('retry_count', 0)
                ))
            
            return reminders
            
        except Exception as e:
            logger.error(f"Failed to fetch pending reminders: {e}")
            raise
    
    async def _send_push_notification(self, reminder: ReminderRecord) -> None:
        """Send push notification for reminder"""
        if not reminder.push_token:
            logger.warning(f"No push token for reminder {reminder.id}")
            await self._mark_reminder_sent(reminder.id, "No push token")
            return
        
        try:
            # Create push message
            message = PushMessage(
                to=reminder.push_token,
                title="ParentPal Reminder",
                body=reminder.message,
                data={
                    'type': 'event_reminder',
                    'event_id': reminder.event_id,
                    'reminder_id': reminder.id
                },
                sound='default',
                badge=1
            )
            
            # Send notification
            response = self.push_client.publish(message)
            
            # Handle response
            if response.is_success():
                logger.info(f"Successfully sent push notification for reminder {reminder.id}")
                await self._mark_reminder_sent(reminder.id)
            else:
                error_msg = f"Push notification failed: {response.details}"
                logger.error(error_msg)
                raise PushNotificationError(error_msg)
                
        except DeviceNotRegisteredError:
            logger.warning(f"Device not registered for reminder {reminder.id}")
            await self._mark_reminder_sent(reminder.id, "Device not registered")
            
        except PushServerError as e:
            logger.error(f"Push server error for reminder {reminder.id}: {e}")
            raise PushNotificationError(f"Push server error: {e}")
            
        except Exception as e:
            logger.error(f"Failed to send push notification for reminder {reminder.id}: {e}")
            raise PushNotificationError(f"Failed to send push notification: {e}")
    
    async def _mark_reminder_sent(self, reminder_id: str, error_message: Optional[str] = None) -> None:
        """Mark reminder as sent"""
        try:
            update_data = {
                'sent_at_ts': datetime.utcnow().isoformat(),
                'status': 'sent' if not error_message else 'failed'
            }
            
            if error_message:
                update_data['error_message'] = error_message
            
            self.supabase.table('reminders').update(update_data).eq('id', reminder_id).execute()
            
        except Exception as e:
            logger.error(f"Failed to mark reminder {reminder_id} as sent: {e}")
    
    async def _handle_push_failure(self, reminder: ReminderRecord, error_message: str) -> None:
        """Handle push notification failure with retry logic"""
        try:
            retry_count = reminder.retry_count + 1
            
            if retry_count >= 5:
                # Max retries reached, mark as failed
                self.supabase.table('reminders').update({
                    'status': 'failed',
                    'error_message': error_message,
                    'retry_count': retry_count
                }).eq('id', reminder.id).execute()
                
                logger.error(f"Reminder {reminder.id} failed after {retry_count} retries")
            else:
                # Schedule retry
                self.supabase.table('reminders').update({
                    'retry_count': retry_count,
                    'error_message': error_message
                }).eq('id', reminder.id).execute()
                
                logger.info(f"Scheduled retry {retry_count} for reminder {reminder.id}")
                
        except Exception as e:
            logger.error(f"Failed to handle push failure for reminder {reminder.id}: {e}")

async def main():
    """Main entry point"""
    worker = ReminderWorker()
    
    # Process events (calendar sync and reminder creation)
    await worker.process_events()
    
    # Process push notifications
    await worker.process_push_notifications()

def process_events():
    """Synchronous entry point for event processing"""
    asyncio.run(main())

if __name__ == "__main__":
    process_events()