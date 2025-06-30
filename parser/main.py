#!/usr/bin/env python3
"""
Event Parser Service - Main Entry Point

Converts raw email content from inbound_emails table into structured events
using regex patterns and Ollama LLM as fallback for complex parsing.
"""

import os
import sys
import json
import time
import logging
import asyncio
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import traceback

import requests
from supabase import create_client, Client
import asyncpg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class ParsedEvent:
    """Structured event data from parsed email"""
    title: str
    start_ts: str
    end_ts: str
    location: Optional[str] = None
    prep_items: Optional[List[str]] = None
    confidence: float = 0.0
    child_id: Optional[str] = None

@dataclass
class EmailRecord:
    """Email record from inbound_emails table"""
    id: str
    user_id: str
    raw_body: str
    subject: str
    from_email: str
    received_at: str
    processed: bool = False

class OllamaClient:
    """Client for interacting with local Ollama instance"""
    
    def __init__(self, base_url: str, model: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.timeout = timeout
        self.session = requests.Session()
    
    def health_check(self) -> bool:
        """Check if Ollama service is available"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    def generate(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        """Generate response from Ollama model"""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_predict": 512
            }
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            raise TimeoutError(f"Ollama request timed out after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Ollama request failed: {e}")

class RegexParser:
    """Regex-based email parsing for common patterns"""
    
    # Date patterns
    DATE_PATTERNS = [
        r'(\d{4}-\d{2}-\d{2})',  # ISO date
        r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
        r'(\d{1,2}-\d{1,2}-\d{4})',  # MM-DD-YYYY
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})',  # Month DD, YYYY
    ]
    
    # Time patterns
    TIME_PATTERNS = [
        r'(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)',  # HH:MM AM/PM
        r'(\d{1,2}\s*[AaPp][Mm])',  # H AM/PM
    ]
    
    # Location patterns
    LOCATION_PATTERNS = [
        r'(?:location|venue|address|at):\s*([^\n\r]+)',
        r'(?:held at|taking place at|located at)\s*([^\n\r]+)',
    ]
    
    # Prep items patterns
    PREP_PATTERNS = [
        r'(?:bring|pack|remember to bring|don\'t forget):\s*([^\n\r]+)',
        r'(?:items needed|required items|what to bring):\s*([^\n\r]+)',
        r'(?:prep|preparation):\s*([^\n\r]+)',
    ]
    
    def parse(self, email_body: str, subject: str) -> Tuple[Optional[ParsedEvent], float]:
        """Parse email using regex patterns"""
        confidence = 0.0
        parsed_data = {}
        
        # Extract title from subject
        title = self._clean_subject(subject)
        if title:
            parsed_data['title'] = title
            confidence += 0.2
        
        # Extract dates
        dates = self._extract_dates(email_body)
        if dates:
            parsed_data['start_ts'] = dates[0]
            parsed_data['end_ts'] = dates[1] if len(dates) > 1 else dates[0]
            confidence += 0.4
        
        # Extract location
        location = self._extract_location(email_body)
        if location:
            parsed_data['location'] = location
            confidence += 0.2
        
        # Extract prep items
        prep_items = self._extract_prep_items(email_body)
        if prep_items:
            parsed_data['prep_items'] = prep_items
            confidence += 0.2
        
        if confidence >= 0.4:  # Minimum viable parse
            try:
                event = ParsedEvent(**parsed_data, confidence=confidence)
                return event, confidence
            except TypeError as e:
                logger.warning(f"Failed to create ParsedEvent: {e}")
                return None, 0.0
        
        return None, confidence
    
    def _clean_subject(self, subject: str) -> str:
        """Clean and extract title from email subject"""
        # Remove common prefixes
        prefixes = ['re:', 'fwd:', 'fw:', '[reminder]', '[event]']
        cleaned = subject.lower()
        for prefix in prefixes:
            if cleaned.startswith(prefix):
                subject = subject[len(prefix):].strip()
                cleaned = subject.lower()
        
        return subject.strip()
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text"""
        dates = []
        
        for pattern in self.DATE_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Try to parse and normalize date
                    if re.match(r'\d{4}-\d{2}-\d{2}', match):
                        dates.append(match)
                    elif '/' in match:
                        dt = datetime.strptime(match, '%m/%d/%Y')
                        dates.append(dt.strftime('%Y-%m-%d'))
                    elif '-' in match:
                        dt = datetime.strptime(match, '%m-%d-%Y')
                        dates.append(dt.strftime('%Y-%m-%d'))
                    else:
                        # Handle month names
                        dt = datetime.strptime(match, '%B %d, %Y')
                        dates.append(dt.strftime('%Y-%m-%d'))
                except ValueError:
                    continue
        
        return list(set(dates))  # Remove duplicates
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text"""
        for pattern in self.LOCATION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_prep_items(self, text: str) -> Optional[List[str]]:
        """Extract preparation items from text"""
        items = []
        
        for pattern in self.PREP_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                items_text = match.group(1).strip()
                # Split by common delimiters
                split_items = re.split(r'[,;•\n\r]+', items_text)
                items.extend([item.strip() for item in split_items if item.strip()])
        
        return items if items else None

class EventParser:
    """Main event parser service"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.ollama_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = os.getenv('OLLAMA_MODEL', 'llama3.1:8b')
        
        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing required environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.ollama = OllamaClient(self.ollama_url, self.ollama_model)
        self.regex_parser = RegexParser()
        
        # Load prompt template
        self.prompt_template = self._load_prompt_template()
    
    def _load_prompt_template(self) -> str:
        """Load the event parsing prompt template"""
        try:
            with open('prompt/event_prompt.txt', 'r') as f:
                return f.read()
        except FileNotFoundError:
            logger.warning("Prompt template not found, using default")
            return self._get_default_prompt()
    
    def _get_default_prompt(self) -> str:
        """Default prompt template if file not found"""
        return """
You are an expert at parsing email content to extract event information.

Extract the following information from the email:
- title: Event name/title
- start_date: Start date (YYYY-MM-DD format)
- start_time: Start time (HH:MM format, 24-hour)
- end_date: End date (YYYY-MM-DD format, can be same as start)
- end_time: End time (HH:MM format, 24-hour)
- location: Event location/venue
- prep_items: List of items to bring/prepare

Return ONLY a valid JSON object with these fields. If information is not available, use null.

Email content:
{email_content}
"""
    
    async def parse_queue(self) -> None:
        """Main parsing loop - process unprocessed emails"""
        logger.info("Starting event parser queue processing")
        
        # Health check
        if not self.ollama.health_check():
            logger.error("Ollama service not available")
            return
        
        try:
            while True:
                # Get unprocessed emails
                emails = await self._get_unprocessed_emails()
                
                if not emails:
                    logger.info("No unprocessed emails found, waiting...")
                    await asyncio.sleep(10)
                    continue
                
                logger.info(f"Processing {len(emails)} emails")
                
                for email in emails:
                    try:
                        await self._process_email(email)
                    except Exception as e:
                        logger.error(f"Failed to process email {email.id}: {e}")
                        logger.error(traceback.format_exc())
                        await self._mark_email_processed(email.id, success=False)
                
                await asyncio.sleep(5)  # Brief pause between batches
                
        except KeyboardInterrupt:
            logger.info("Parser stopped by user")
        except Exception as e:
            logger.error(f"Parser crashed: {e}")
            logger.error(traceback.format_exc())
    
    async def _get_unprocessed_emails(self) -> List[EmailRecord]:
        """Fetch unprocessed emails from database"""
        try:
            response = self.supabase.table('inbound_emails').select('*').eq('processed', False).execute()
            
            emails = []
            for row in response.data:
                emails.append(EmailRecord(
                    id=row['id'],
                    user_id=row['user_id'],
                    raw_body=row['raw_body'],
                    subject=row['subject'],
                    from_email=row['from_email'],
                    received_at=row['received_at'],
                    processed=row['processed']
                ))
            
            return emails
        except Exception as e:
            logger.error(f"Failed to fetch emails: {e}")
            return []
    
    async def _process_email(self, email: EmailRecord) -> None:
        """Process a single email with retry logic"""
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                # Check for existing event with same source_msg_id
                existing = self.supabase.table('events').select('id').eq('source_msg_id', email.id).execute()
                if existing.data:
                    logger.info(f"Event already exists for email {email.id}")
                    await self._mark_email_processed(email.id, success=True)
                    return
                
                # Try regex parsing first
                parsed_event, confidence = self.regex_parser.parse(email.raw_body, email.subject)
                
                # If confidence too low, use Ollama
                if confidence < 0.7:
                    logger.info(f"Low confidence ({confidence:.2f}), using Ollama for email {email.id}")
                    parsed_event = await self._parse_with_ollama(email)
                
                if parsed_event:
                    # Find matching child
                    child_id = await self._find_child_id(email.user_id, email.subject, email.raw_body)
                    parsed_event.child_id = child_id
                    
                    # Insert event
                    await self._insert_event(email, parsed_event)
                    await self._mark_email_processed(email.id, success=True)
                    logger.info(f"Successfully processed email {email.id}")
                    return
                else:
                    # Mark as needs review
                    await self._insert_event(email, None, status='needs_review')
                    await self._mark_email_processed(email.id, success=True)
                    logger.warning(f"Could not parse email {email.id}, marked for review")
                    return
                    
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed for email {email.id}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    await self._mark_email_processed(email.id, success=False)
                    raise
    
    async def _parse_with_ollama(self, email: EmailRecord) -> Optional[ParsedEvent]:
        """Parse email using Ollama LLM"""
        try:
            prompt = self.prompt_template.format(
                email_content=f"Subject: {email.subject}\n\nBody:\n{email.raw_body}"
            )
            
            response = self.ollama.generate(prompt)
            response_text = response.get('response', '').strip()
            
            # Try to parse JSON response
            try:
                data = json.loads(response_text)
                
                # Convert to our format
                start_ts = f"{data.get('start_date')}T{data.get('start_time', '00:00')}:00"
                end_ts = f"{data.get('end_date', data.get('start_date'))}T{data.get('end_time', data.get('start_time', '23:59'))}:00"
                
                return ParsedEvent(
                    title=data.get('title', 'Untitled Event'),
                    start_ts=start_ts,
                    end_ts=end_ts,
                    location=data.get('location'),
                    prep_items=data.get('prep_items'),
                    confidence=0.8  # High confidence for LLM parse
                )
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from Ollama: {response_text}")
                return None
                
        except Exception as e:
            logger.error(f"Ollama parsing failed: {e}")
            return None
    
    async def _find_child_id(self, user_id: str, subject: str, body: str) -> Optional[str]:
        """Find matching child based on name in subject/body"""
        try:
            # Get user's children
            response = self.supabase.table('children').select('id, name').eq('user_id', user_id).execute()
            
            text = f"{subject} {body}".lower()
            
            for child in response.data:
                if child['name'].lower() in text:
                    return child['id']
            
            return None
        except Exception as e:
            logger.error(f"Failed to find child ID: {e}")
            return None
    
    async def _insert_event(self, email: EmailRecord, parsed_event: Optional[ParsedEvent], status: str = 'upcoming') -> None:
        """Insert event into database"""
        try:
            event_data = {
                'user_id': email.user_id,
                'source_msg_id': email.id,
                'status': status
            }
            
            if parsed_event:
                event_data.update({
                    'title': parsed_event.title,
                    'start_ts': parsed_event.start_ts,
                    'end_ts': parsed_event.end_ts,
                    'location': parsed_event.location,
                    'prep_items': parsed_event.prep_items,
                    'child_id': parsed_event.child_id
                })
            else:
                # Fallback data for unparseable emails
                event_data.update({
                    'title': f"Review: {email.subject}",
                    'start_ts': datetime.now().isoformat(),
                    'end_ts': datetime.now().isoformat()
                })
            
            self.supabase.table('events').insert(event_data).execute()
            
        except Exception as e:
            logger.error(f"Failed to insert event: {e}")
            raise
    
    async def _mark_email_processed(self, email_id: str, success: bool = True) -> None:
        """Mark email as processed"""
        try:
            self.supabase.table('inbound_emails').update({
                'processed': True,
                'processed_at': datetime.now().isoformat()
            }).eq('id', email_id).execute()
        except Exception as e:
            logger.error(f"Failed to mark email processed: {e}")

def main():
    """Main entry point"""
    parser = EventParser()
    asyncio.run(parser.parse_queue())

if __name__ == "__main__":
    main()