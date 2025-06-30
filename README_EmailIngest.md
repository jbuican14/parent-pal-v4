# Email Ingest Service

A Cloud Run Function that receives Gmail Pub/Sub push notifications and stores raw emails in the `inbound_emails` table for further processing by the Event Parser Service.

## Features

- **Gmail Pub/Sub Integration**: Receives real-time notifications when new emails arrive
- **JWT Verification**: Validates Google-signed JWTs for security
- **Gmail API Integration**: Fetches full email content using Gmail API
- **Database Storage**: Stores emails in Supabase with idempotent operations
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Production Ready**: Optimized Docker image and proper logging

## Architecture

```
Gmail → Pub/Sub → Cloud Run Function → Supabase
                      ↓
                 Gmail API (fetch content)
```

## Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Supabase Configuration
SUPABASE_DB_URL=postgresql://postgres:password@host:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Google Cloud Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-gcp-project-id

# Gmail Configuration
GMAIL_WATCH_LABEL=school-events
```

## Google Cloud Setup

### 1. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create gmail-ingest \
    --display-name="Gmail Ingest Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gmail-ingest@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/gmail.readonly"

# Create and download key
gcloud iam service-accounts keys create gmail-ingest-key.json \
    --iam-account=gmail-ingest@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Enable APIs

```bash
# Enable required APIs
gcloud services enable gmail.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable run.googleapis.com
```

### 3. Create Pub/Sub Topic and Subscription

```bash
# Create topic
gcloud pubsub topics create gmail-notifications

# Create subscription
gcloud pubsub subscriptions create gmail-ingest-sub \
    --topic=gmail-notifications \
    --push-endpoint=https://your-cloud-run-url.run.app
```

### 4. Set Up Gmail Watch

```bash
# Use Gmail API to set up watch
curl -X POST \
  'https://gmail.googleapis.com/gmail/v1/users/me/watch' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "topicName": "projects/YOUR_PROJECT_ID/topics/gmail-notifications",
    "labelIds": ["school-events"]
  }'
```

## Local Development

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables

```bash
export SUPABASE_DB_URL="postgresql://..."
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export GOOGLE_PROJECT_ID="your-project-id"
```

### 3. Run Locally

```bash
# Run with Functions Framework
functions-framework --target=handle_pubsub --port=8080

# Or run directly
python main.py
```

### 4. Test with Sample Request

```bash
# Create test JWT (for development)
python -c "
import jwt
import json
import base64
from datetime import datetime, timedelta

# Create test payload
payload = {
    'iss': 'accounts.google.com',
    'aud': 'your-project-id',
    'exp': int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
    'sub': 'test-user'
}

token = jwt.encode(payload, 'secret', algorithm='HS256')
print(f'Bearer {token}')
"

# Create test Pub/Sub message
python -c "
import json
import base64

data = {
    'historyId': '123456789',
    'emailAddress': 'test@example.com'
}

encoded = base64.b64encode(json.dumps(data).encode()).decode()
message = {
    'message': {
        'data': encoded,
        'messageId': 'test-msg-123',
        'publishTime': '2024-01-01T12:00:00Z'
    }
}

print(json.dumps(message))
"

# Send test request
curl -X POST http://localhost:8080 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"BASE64_ENCODED_DATA"}}'
```

## Deployment

### 1. Build Docker Image

```bash
# Build image
docker build -t gmail-ingest .

# Test locally
docker run -p 8080:8080 \
  -e SUPABASE_DB_URL="postgresql://..." \
  -e GOOGLE_CLIENT_EMAIL="..." \
  gmail-ingest
```

### 2. Deploy to Cloud Run

```bash
# Build and deploy
gcloud run deploy gmail-ingest \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_DB_URL="postgresql://..." \
  --set-env-vars GOOGLE_CLIENT_EMAIL="..." \
  --set-env-vars GOOGLE_PRIVATE_KEY="..." \
  --set-env-vars GOOGLE_PROJECT_ID="..." \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60s \
  --max-instances 10
```

### 3. Update Pub/Sub Subscription

```bash
# Update subscription with Cloud Run URL
gcloud pubsub subscriptions modify-push-config gmail-ingest-sub \
  --push-endpoint=https://your-cloud-run-url.run.app
```

## Testing

### 1. Run Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-mock

# Run tests
pytest tests/email_ingest_test.py -v

# Run with coverage
pytest tests/email_ingest_test.py --cov=main --cov-report=html
```

### 2. Test Coverage

The test suite covers:

- ✅ JWT verification (valid/invalid tokens)
- ✅ Pub/Sub data extraction
- ✅ Gmail API integration
- ✅ Database operations
- ✅ Error handling
- ✅ Integration scenarios

### 3. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config
cat > load-test.yml << EOF
config:
  target: 'https://your-cloud-run-url.run.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Pub/Sub notification"
    requests:
      - post:
          url: "/"
          headers:
            Authorization: "Bearer YOUR_JWT_TOKEN"
            Content-Type: "application/json"
          json:
            message:
              data: "BASE64_ENCODED_DATA"
EOF

# Run load test
artillery run load-test.yml
```

## Monitoring

### 1. Cloud Logging

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gmail-ingest" \
  --limit 50 \
  --format json
```

### 2. Metrics

Monitor these key metrics:

- **Request Count**: Number of Pub/Sub notifications processed
- **Error Rate**: Percentage of failed requests
- **Latency**: Response time distribution
- **Memory Usage**: Memory consumption
- **Cold Starts**: Function initialization time

### 3. Alerts

Set up alerts for:

- Error rate > 5%
- Latency > 10 seconds
- Memory usage > 80%
- No requests for > 1 hour (indicates broken Pub/Sub)

## Troubleshooting

### Common Issues

1. **JWT Verification Failed**
   ```
   Error: Invalid JWT: Invalid issuer
   ```
   - Check `GOOGLE_PROJECT_ID` environment variable
   - Verify JWT token format and claims

2. **Gmail API Permission Denied**
   ```
   Error: Gmail API error: 403 Forbidden
   ```
   - Verify service account has Gmail API access
   - Check OAuth scopes in service account

3. **Database Connection Failed**
   ```
   Error: Failed to store email: connection failed
   ```
   - Verify `SUPABASE_DB_URL` format
   - Check network connectivity to Supabase
   - Verify database credentials

4. **User Not Found**
   ```
   Error: User not found
   ```
   - Verify user exists in `auth.users` table
   - Check email address matching

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
python main.py
```

### Health Checks

The service includes health check endpoints:

```bash
# Check service health
curl https://your-cloud-run-url.run.app/health

# Check database connectivity
curl https://your-cloud-run-url.run.app/health/db
```

## Security Considerations

1. **JWT Verification**: Always verify Google-signed JWTs
2. **Environment Variables**: Never commit secrets to version control
3. **Database Access**: Use service role key with minimal permissions
4. **Network Security**: Restrict Cloud Run ingress to Pub/Sub
5. **Error Handling**: Don't leak sensitive information in error messages

## Performance Optimization

1. **Connection Pooling**: Use connection pooling for database
2. **Caching**: Cache Gmail API credentials
3. **Batch Processing**: Process multiple emails in batches
4. **Resource Limits**: Set appropriate CPU and memory limits
5. **Cold Start Optimization**: Minimize dependencies and initialization time

## Cost Optimization

1. **Resource Sizing**: Right-size CPU and memory allocation
2. **Request Timeout**: Set appropriate timeout values
3. **Concurrency**: Optimize concurrent request handling
4. **Idle Scaling**: Scale to zero when not in use
5. **Regional Deployment**: Deploy in cost-effective regions

## Compliance

- **Data Privacy**: Emails are stored securely in Supabase
- **GDPR**: Support for data deletion and export
- **SOC 2**: Cloud Run and Supabase are SOC 2 compliant
- **Encryption**: Data encrypted in transit and at rest

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review Cloud Run logs
3. Verify environment configuration
4. Test with sample requests
5. Contact support with detailed error logs

## Changelog

### v1.0.0
- Initial release
- Gmail Pub/Sub integration
- JWT verification
- Database storage
- Comprehensive testing
- Production deployment