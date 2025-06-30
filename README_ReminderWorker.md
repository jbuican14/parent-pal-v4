# Reminder Worker Service

A scheduled service that processes events to create Google Calendar entries and manage push notification reminders for the ParentPal application.

## Features

- **Google Calendar Sync**: Creates and updates calendar events for users
- **Push Notifications**: Schedules and sends reminder notifications
- **Retry Logic**: Handles failures with exponential backoff
- **Idempotent Operations**: Prevents duplicate calendar events and notifications
- **User OAuth Integration**: Respects per-user Google Calendar permissions

## Architecture

```
Events (status=pending) → Reminder Worker → Google Calendar
                                        ↓
                       Reminders Table → Push Notifications
```

## Environment Variables

Set these environment variables for the service:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Calendar Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## Database Schema Requirements

The service expects these tables to exist:

### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  child_id UUID REFERENCES children(id),
  title TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  location TEXT,
  prep_items TEXT[],
  status TEXT DEFAULT 'pending',
  google_calendar_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Reminders Table
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  notify_at_ts TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  push_token TEXT,
  sent_at_ts TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, notify_at_ts)
);
```

### Users Table (additional columns)
```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
```

## Workflow

### Event Processing

1. **Query Pending Events**: Fetch events with `status='pending'`
2. **Google Calendar Sync**: Create/update calendar events using user's OAuth token
3. **Create Reminders**: Insert reminder records for 24h, 3h, and 30min before event
4. **Mark as Synced**: Update event status to `'synced'`

### Push Notification Processing

1. **Query Due Reminders**: Fetch reminders where `notify_at_ts <= now()` and `sent_at_ts IS NULL`
2. **Send Notifications**: Use Expo Push API to send notifications
3. **Handle Failures**: Retry up to 5 times with exponential backoff
4. **Mark as Sent**: Update reminder with `sent_at_ts`

## Local Development

### 1. Install Dependencies

```bash
pip install -r worker/requirements.txt
```

### 2. Set Environment Variables

```bash
export EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export GOOGLE_PROJECT_ID="your-project-id"
export EXPO_ACCESS_TOKEN="your-expo-token"
```

### 3. Run Locally

```bash
# Run event processing
python worker/main.py

# Or run specific functions
python -c "
from worker.main import ReminderWorker
import asyncio

async def test():
    worker = ReminderWorker()
    await worker.process_events()
    await worker.process_push_notifications()

asyncio.run(test())
"
```

### 4. Test with Sample Data

```sql
-- Insert test event
INSERT INTO events (user_id, title, start_ts, end_ts, status)
VALUES (
  'your-user-id',
  'Test Event',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '3 hours',
  'pending'
);

-- Check reminders created
SELECT * FROM reminders WHERE event_id = 'your-event-id';
```

## Deployment

### 1. Docker Build

```bash
# Build image
docker build -t reminder-worker .

# Test locally
docker run --env-file .env reminder-worker
```

### 2. Kubernetes Deployment

```bash
# Create secrets
kubectl create secret generic reminder-worker-secrets \
  --from-literal=supabase-url="https://your-project.supabase.co" \
  --from-literal=supabase-service-role-key="your-key" \
  --from-literal=google-client-email="service-account@project.iam.gserviceaccount.com" \
  --from-literal=google-private-key="-----BEGIN PRIVATE KEY-----..." \
  --from-literal=google-project-id="your-project-id" \
  --from-literal=expo-access-token="your-expo-token"

# Deploy CronJob
kubectl apply -f cron.yaml

# Check status
kubectl get cronjobs
kubectl get jobs
kubectl logs job/reminder-worker-xxxxx
```

### 3. Supabase Edge Functions (Alternative)

```sql
-- Create Supabase Edge Cron
SELECT cron.schedule(
  'reminder-worker',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://your-edge-function-url.supabase.co/functions/v1/reminder-worker',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```

## Testing

### 1. Run Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run tests
pytest tests/reminder_worker_test.py -v

# Run with coverage
pytest tests/reminder_worker_test.py --cov=worker --cov-report=html
```

### 2. Test Coverage

The test suite covers:

- ✅ Event processing workflow
- ✅ Google Calendar integration
- ✅ Push notification sending
- ✅ Retry logic and failure handling
- ✅ Database operations
- ✅ Error scenarios

### 3. Integration Testing

```bash
# Test with real Supabase (use test database)
export EXPO_PUBLIC_SUPABASE_URL="https://test-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="test-key"

python -c "
from worker.main import ReminderWorker
import asyncio

async def integration_test():
    worker = ReminderWorker()
    
    # Test event processing
    await worker.process_events()
    print('Event processing completed')
    
    # Test push notifications
    await worker.process_push_notifications()
    print('Push notification processing completed')

asyncio.run(integration_test())
"
```

## Google Calendar Setup

### 1. Create OAuth Credentials

```bash
# Go to Google Cloud Console
# Enable Calendar API
# Create OAuth 2.0 credentials
# Download client_secret.json
```

### 2. User Authorization Flow

```javascript
// In your mobile app, implement OAuth flow
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar'],
  webClientId: 'your-web-client-id',
  offlineAccess: true,
});

const signIn = async () => {
  const userInfo = await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  
  // Store refresh token in Supabase
  await supabase.auth.updateUser({
    data: { google_refresh_token: tokens.refreshToken }
  });
};
```

## Push Notification Setup

### 1. Expo Configuration

```bash
# Install Expo CLI
npm install -g @expo/cli

# Get access token
expo login
expo whoami
```

### 2. Mobile App Integration

```javascript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get push token
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Store in Supabase
await supabase.auth.updateUser({
  data: { expo_push_token: token }
});
```

## Monitoring

### 1. Logging

```bash
# View logs in Kubernetes
kubectl logs -f cronjob/reminder-worker

# View logs in Docker
docker logs reminder-worker
```

### 2. Metrics

Monitor these key metrics:

- **Event Processing Rate**: Events processed per minute
- **Calendar Sync Success Rate**: Percentage of successful calendar syncs
- **Push Notification Delivery Rate**: Percentage of successful notifications
- **Retry Rate**: Number of retries vs. total attempts
- **Error Rate**: Failed operations per total operations

### 3. Alerts

Set up alerts for:

- Event processing failures > 5%
- Push notification failures > 10%
- Calendar sync failures > 20%
- Worker not running for > 5 minutes

## Troubleshooting

### Common Issues

1. **Google Calendar Permission Denied**
   ```
   Error: Calendar API access denied
   ```
   - Verify user has granted calendar permissions
   - Check OAuth token validity
   - Refresh expired tokens

2. **Push Notification Failed**
   ```
   Error: DeviceNotRegisteredError
   ```
   - User uninstalled app or token expired
   - Remove invalid tokens from database
   - Handle gracefully in retry logic

3. **Database Connection Failed**
   ```
   Error: Failed to connect to Supabase
   ```
   - Check network connectivity
   - Verify service role key
   - Check RLS policies

4. **Event Already Synced**
   ```
   Warning: Event already has calendar ID
   ```
   - Normal behavior for updates
   - Verify idempotency is working
   - Check for duplicate processing

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
python worker/main.py
```

### Health Checks

```bash
# Check service health
python -c "
from worker.main import ReminderWorker
worker = ReminderWorker()
print('Worker initialized successfully')
"

# Test database connection
python -c "
from worker.main import ReminderWorker
import asyncio

async def health_check():
    worker = ReminderWorker()
    events = await worker._get_pending_events()
    print(f'Found {len(events)} pending events')

asyncio.run(health_check())
"
```

## Performance Optimization

### 1. Batch Processing

```python
# Process events in batches
async def process_events_batch(self, batch_size: int = 10):
    events = await self._get_pending_events()
    
    for i in range(0, len(events), batch_size):
        batch = events[i:i + batch_size]
        await asyncio.gather(*[
            self._process_single_event(event) 
            for event in batch
        ])
```

### 2. Connection Pooling

```python
# Use connection pooling for database
import psycopg_pool

pool = psycopg_pool.AsyncConnectionPool(
    conninfo=SUPABASE_DB_URL,
    min_size=1,
    max_size=10
)
```

### 3. Caching

```python
# Cache calendar services
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_calendar_service(user_id: str):
    return self._get_user_calendar_service(user_id)
```

## Security Considerations

1. **Token Storage**: Store OAuth tokens securely in Supabase
2. **Service Account**: Use minimal permissions for service account
3. **Network Security**: Restrict worker network access
4. **Error Handling**: Don't leak sensitive information in logs
5. **Rate Limiting**: Respect Google Calendar API rate limits

## Cost Optimization

1. **Scheduling**: Run worker only when needed
2. **Batch Operations**: Group API calls efficiently
3. **Resource Limits**: Set appropriate CPU/memory limits
4. **Cleanup**: Remove old reminders and failed events
5. **Monitoring**: Track API usage and costs

## Compliance

- **Data Privacy**: Handle user data according to privacy policies
- **GDPR**: Support data deletion and export
- **Calendar Permissions**: Respect user calendar access preferences
- **Notification Preferences**: Honor user notification settings

## Support

For issues with the Reminder Worker:

1. Check the troubleshooting section
2. Review worker logs
3. Verify environment configuration
4. Test with sample data
5. Contact support with detailed error information

## Changelog

### v1.0.0
- Initial release
- Google Calendar integration
- Push notification scheduling
- Retry logic and error handling
- Comprehensive testing
- Kubernetes deployment support