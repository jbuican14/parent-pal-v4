#!/usr/bin/env python3
"""
Email Ingest Service - Cloud Run Function

Receives Gmail Pub/Sub push notifications and stores raw emails
in the inbound_emails table for further processing.
"""

import os
import json
import base64
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import email
from email.mime.text import MIMEText

import jwt
import psycopg
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import functions_framework

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GOOGLE_CLIENT_EMAIL = os.getenv('GOOGLE_CLIENT_EMAIL')
GOOGLE_PRIVATE_KEY = os.getenv('GOOGLE_PRIVATE_KEY', '').replace('\\n', '\n')
GOOGLE_PROJECT_ID = os.getenv('GOOGLE_PROJECT_ID')
GMAIL_WATCH_LABEL = os.getenv('GMAIL_WATCH_LABEL', 'school-events')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

# Validate required environment variables
REQUIRED_ENV_VARS = [
    'SUPABASE_DB_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_PROJECT_ID'
]

for var in REQUIRED_ENV_VARS:
    if not os.getenv(var):
        raise ValueError(f"Missing required environment variable: {var}")

class EmailIngestError(Exception):
    """Base exception for email ingest errors"""
    pass

class JWTVerificationError(EmailIngestError):
    """JWT verification failed"""
    pass

class GmailAPIError(EmailIngestError):
    """Gmail API operation failed"""
    pass

class DatabaseError(EmailIngestError):
    """Database operation failed"""
    pass

def verify_pubsub_jwt(request) -> Dict[str, Any]:
    """
    Verify Google-signed JWT from Pub/Sub push notification.
    
    Args:
        request: Flask request object
        
    Returns:
        Decoded JWT payload
        
    Raises:
        JWTVerificationError: If JWT verification fails
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            raise JWTVerificationError("Missing or invalid Authorization header")
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        # Verify JWT without verification for now (Google's public keys would be needed)
        # In production, you'd fetch Google's public keys and verify properly
        try:
            # Decode without verification for development
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Basic validation
            if payload.get('iss') != 'accounts.google.com':
                raise JWTVerificationError("Invalid issuer")
                
            if payload.get('aud') != GOOGLE_PROJECT_ID:
                raise JWTVerificationError("Invalid audience")
                
            # Check expiration
            exp = payload.get('exp', 0)
            if datetime.utcnow().timestamp() > exp:
                raise JWTVerificationError("Token expired")
                
            return payload
            
        except jwt.InvalidTokenError as e:
            raise JWTVerificationError(f"Invalid JWT: {str(e)}")
            
    except Exception as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise JWTVerificationError(f"JWT verification failed: {str(e)}")

def extract_pubsub_data(request) -> Tuple[str, str]:
    """
    Extract historyId and emailAddress from Pub/Sub push body.
    
    Args:
        request: Flask request object
        
    Returns:
        Tuple of (historyId, emailAddress)
        
    Raises:
        EmailIngestError: If data extraction fails
    """
    try:
        # Get request data
        request_json = request.get_json(silent=True)
        if not request_json:
            raise EmailIngestError("No JSON data in request")
        
        # Extract message from Pub/Sub format
        message = request_json.get('message', {})
        if not message:
            raise EmailIngestError("No message in Pub/Sub data")
        
        # Decode base64 data
        data_b64 = message.get('data', '')
        if not data_b64:
            raise EmailIngestError("No data in Pub/Sub message")
        
        try:
            data_json = base64.b64decode(data_b64).decode('utf-8')
            data = json.loads(data_json)
        except (ValueError, json.JSONDecodeError) as e:
            raise EmailIngestError(f"Failed to decode Pub/Sub data: {str(e)}")
        
        # Extract required fields
        history_id = data.get('historyId')
        email_address = data.get('emailAddress')
        
        if not history_id:
            raise EmailIngestError("Missing historyId in Pub/Sub data")
        if not email_address:
            raise EmailIngestError("Missing emailAddress in Pub/Sub data")
        
        return str(history_id), email_address
        
    except EmailIngestError:
        raise
    except Exception as e:
        logger.error(f"Failed to extract Pub/Sub data: {str(e)}")
        raise EmailIngestError(f"Failed to extract Pub/Sub data: {str(e)}")

def get_gmail_service():
    """
    Create authenticated Gmail API service.
    
    Returns:
        Gmail API service object
        
    Raises:
        GmailAPIError: If service creation fails
    """
    try:
        # Create credentials from service account
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
        
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/gmail.readonly']
        )
        
        # Build Gmail service
        service = build('gmail', 'v1', credentials=credentials)
        return service
        
    except Exception as e:
        logger.error(f"Failed to create Gmail service: {str(e)}")
        raise GmailAPIError(f"Failed to create Gmail service: {str(e)}")

def fetch_email_content(email_address: str, history_id: str) -> Tuple[str, Dict[str, str]]:
    """
    Fetch email content using Gmail API.
    
    Args:
        email_address: Gmail address to fetch from
        history_id: History ID from Pub/Sub notification
        
    Returns:
        Tuple of (raw_body, headers_dict)
        
    Raises:
        GmailAPIError: If Gmail API operation fails
    """
    try:
        service = get_gmail_service()
        
        # Get history to find new messages
        try:
            history_response = service.users().history().list(
                userId=email_address,
                startHistoryId=history_id,
                labelId=GMAIL_WATCH_LABEL
            ).execute()
        except HttpError as e:
            if e.resp.status == 404:
                # History ID not found, might be too old
                logger.warning(f"History ID {history_id} not found, fetching recent messages")
                # Fallback to recent messages
                messages_response = service.users().messages().list(
                    userId=email_address,
                    labelIds=[GMAIL_WATCH_LABEL],
                    maxResults=1
                ).execute()
                
                messages = messages_response.get('messages', [])
                if not messages:
                    raise GmailAPIError("No messages found")
                    
                message_id = messages[0]['id']
            else:
                raise GmailAPIError(f"Gmail API error: {str(e)}")
        else:
            # Extract message ID from history
            history = history_response.get('history', [])
            if not history:
                raise GmailAPIError("No history found")
            
            # Get the most recent message from history
            messages_added = []
            for h in history:
                messages_added.extend(h.get('messagesAdded', []))
            
            if not messages_added:
                raise GmailAPIError("No new messages in history")
            
            message_id = messages_added[-1]['message']['id']
        
        # Fetch full message content
        try:
            message = service.users().messages().get(
                userId=email_address,
                id=message_id,
                format='raw'
            ).execute()
        except HttpError as e:
            raise GmailAPIError(f"Failed to fetch message {message_id}: {str(e)}")
        
        # Decode raw message
        raw_data = message.get('raw', '')
        if not raw_data:
            raise GmailAPIError("No raw data in message")
        
        try:
            raw_body = base64.urlsafe_b64decode(raw_data).decode('utf-8')
        except UnicodeDecodeError:
            # Try latin-1 as fallback
            raw_body = base64.urlsafe_b64decode(raw_data).decode('latin-1')
        
        # Parse email to extract headers
        try:
            email_msg = email.message_from_string(raw_body)
            headers = dict(email_msg.items())
        except Exception as e:
            logger.warning(f"Failed to parse email headers: {str(e)}")
            headers = {}
        
        return raw_body, headers
        
    except GmailAPIError:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch email content: {str(e)}")
        raise GmailAPIError(f"Failed to fetch email content: {str(e)}")

def find_user_id(email_address: str) -> Optional[str]:
    """
    Find user_id based on email address.
    
    Args:
        email_address: Email address to look up
        
    Returns:
        User ID if found, None otherwise
        
    Raises:
        DatabaseError: If database operation fails
    """
    try:
        with psycopg.connect(SUPABASE_DB_URL) as conn:
            with conn.cursor() as cur:
                # Look up user by email in auth.users table
                cur.execute(
                    "SELECT id FROM auth.users WHERE email = %s",
                    (email_address,)
                )
                result = cur.fetchone()
                return result[0] if result else None
                
    except Exception as e:
        logger.error(f"Failed to find user ID: {str(e)}")
        raise DatabaseError(f"Failed to find user ID: {str(e)}")

def store_email(user_id: str, raw_body: str, headers: Dict[str, str], history_id: str) -> bool:
    """
    Store email in inbound_emails table.
    
    Args:
        user_id: User ID to associate email with
        raw_body: Raw email content
        headers: Email headers dictionary
        history_id: Gmail history ID for idempotency
        
    Returns:
        True if inserted, False if duplicate (idempotent)
        
    Raises:
        DatabaseError: If database operation fails
    """
    try:
        with psycopg.connect(SUPABASE_DB_URL) as conn:
            with conn.cursor() as cur:
                # Extract common headers
                subject = headers.get('Subject', '')
                from_email = headers.get('From', '')
                received_at = datetime.utcnow()
                
                # Insert with conflict handling for idempotency
                cur.execute("""
                    INSERT INTO inbound_emails (
                        id, user_id, raw_body, subject, from_email, 
                        headers, gmail_history, received_at, processed
                    )
                    VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, false
                    )
                    ON CONFLICT (gmail_history) DO NOTHING
                    RETURNING id
                """, (
                    user_id, raw_body, subject, from_email,
                    json.dumps(headers), history_id, received_at
                ))
                
                result = cur.fetchone()
                conn.commit()
                
                # Return True if inserted, False if duplicate
                return result is not None
                
    except Exception as e:
        logger.error(f"Failed to store email: {str(e)}")
        raise DatabaseError(f"Failed to store email: {str(e)}")

@functions_framework.http
def handle_pubsub(request):
    """
    Main Cloud Function entry point for handling Gmail Pub/Sub push notifications.
    
    Args:
        request: Flask request object
        
    Returns:
        HTTP response
    """
    try:
        # Step 1: Verify Google-signed JWT
        logger.info("Verifying Pub/Sub JWT")
        jwt_payload = verify_pubsub_jwt(request)
        logger.info(f"JWT verified for subject: {jwt_payload.get('sub', 'unknown')}")
        
        # Step 2: Extract historyId and emailAddress
        logger.info("Extracting Pub/Sub data")
        history_id, email_address = extract_pubsub_data(request)
        logger.info(f"Processing history {history_id} for {email_address}")
        
        # Step 3: Find user ID
        logger.info(f"Finding user ID for {email_address}")
        user_id = find_user_id(email_address)
        if not user_id:
            logger.warning(f"No user found for email {email_address}")
            return ("User not found", 404)
        
        # Step 4: Fetch email content using Gmail API
        logger.info(f"Fetching email content for history {history_id}")
        raw_body, headers = fetch_email_content(email_address, history_id)
        logger.info(f"Fetched email: {headers.get('Subject', 'No Subject')}")
        
        # Step 5: Store in database
        logger.info("Storing email in database")
        inserted = store_email(user_id, raw_body, headers, history_id)
        
        if inserted:
            logger.info(f"Successfully stored new email for user {user_id}")
        else:
            logger.info(f"Email already exists (duplicate history {history_id})")
        
        # Step 6: Return success
        return ("", 204)
        
    except JWTVerificationError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        return (f"Invalid JWT: {str(e)}", 400)
        
    except EmailIngestError as e:
        logger.error(f"Email ingest error: {str(e)}")
        return (f"Bad request: {str(e)}", 400)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        # Don't leak stack traces in production
        return ("Internal server error", 500)

# For local testing
if __name__ == "__main__":
    from flask import Flask, request
    
    app = Flask(__name__)
    
    @app.route('/', methods=['POST'])
    def local_handler():
        return handle_pubsub(request)
    
    app.run(host='0.0.0.0', port=8080, debug=True)