# Event Parser Service

A robust email-to-event parsing service that converts raw email content from the `inbound_emails` table into structured event records using regex patterns and local Ollama LLM inference as a fallback.

## Features

- **Dual Parsing Strategy**: Regex patterns for common formats, Ollama LLM for complex content
- **High Accuracy**: Targets ≥85% high-confidence parse rate
- **Idempotent Processing**: Prevents duplicate events using `source_msg_id`
- **Retry Logic**: Exponential backoff with max 3 attempts
- **Child Matching**: Automatically links events to children based on name detection
- **Comprehensive Testing**: Full test suite with mocked dependencies

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  inbound_emails │───▶│  Event Parser    │───▶│     events      │
│     table       │    │    Service       │    │     table       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Ollama LLM      │
                       │  (llama3.1:8b)   │
                       └──────────────────┘
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Optional: Logging Level
LOG_LEVEL=INFO
```

## Ollama Setup

### 1. Install Ollama

Run the setup script to install Ollama and pull the required model:

```bash
chmod +x scripts/setup_ollama.sh
./scripts/setup_ollama.sh
```

Or manually:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model
ollama pull llama3.1:8b

# Start Ollama service
ollama serve
```

### 2. Verify Installation

Check that Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

Should return a JSON response with available models.

## Installation & Deployment

### Local Development

1. **Clone and Setup**:
   ```bash
   git clone <repository>
   cd event-parser
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r parser/requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start Ollama**:
   ```bash
   ollama serve
   ```

4. **Run Parser**:
   ```bash
   python parser/main.py
   ```

### Docker Deployment

1. **Build Image**:
   ```bash
   docker build -t event-parser .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name event-parser \
     --env-file .env \
     --network host \
     event-parser
   ```

3. **With Docker Compose**:
   ```yaml
   version: '3.8'
   services:
     event-parser:
       build: .
       environment:
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - OLLAMA_BASE_URL=http://ollama:11434
       depends_on:
         - ollama
     
     ollama:
       image: ollama/ollama
       ports:
         - "11434:11434"
       volumes:
         - ollama_data:/root/.ollama
   
   volumes:
     ollama_data:
   ```

### Production Deployment

For production environments:

1. **Use a process manager** like systemd or supervisor
2. **Set up monitoring** and health checks
3. **Configure log rotation**
4. **Use a reverse proxy** for Ollama if needed
5. **Set resource limits** for the Ollama container

## Parsing Logic

### 1. Regex Patterns (First Pass)

The parser attempts to extract:

- **Dates**: ISO format, MM/DD/YYYY, Month DD, YYYY
- **Times**: HH:MM AM/PM, H AM/PM
- **Locations**: "Location:", "Venue:", "Address:", "held at", etc.
- **Prep Items**: "bring:", "pack:", "remember to bring:", etc.

### 2. Confidence Scoring

- Title extraction: +0.2
- Date/time found: +0.4
- Location found: +0.2
- Prep items found: +0.2

### 3. Ollama Fallback (< 0.7 confidence)

When regex confidence is below 0.7, the service:

1. Formats email content with the prompt template
2. Sends to local Ollama instance
3. Parses JSON response
4. Assigns 0.8 confidence to LLM results

### 4. Child Matching

Searches email subject and body for child names from the user's children table.

### 5. Event Creation

Inserts structured event with:
- `user_id`, `child_id` (if matched)
- `title`, `start_ts`, `end_ts`
- `location`, `prep_items` (arrays)
- `source_msg_id` (for deduplication)
- `status` ('upcoming' or 'needs_review')

## Testing

Run the comprehensive test suite:

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run all tests
pytest tests/event_parser_test.py -v

# Run specific test categories
pytest tests/event_parser_test.py::TestRegexParser -v
pytest tests/event_parser_test.py::TestOllamaClient -v
pytest tests/event_parser_test.py::TestEventParser -v

# Run with coverage
pip install pytest-cov
pytest tests/event_parser_test.py --cov=parser --cov-report=html
```

### Test Coverage

- ✅ Regex pattern matching
- ✅ Date format parsing
- ✅ Location extraction
- ✅ Prep items parsing
- ✅ Ollama client functionality
- ✅ Health checks
- ✅ Error handling and retries
- ✅ Duplicate prevention
- ✅ Child matching
- ✅ Database operations

## Monitoring & Troubleshooting

### Health Checks

The service includes built-in health checks:

```bash
# Check Ollama connectivity
curl http://localhost:11434/api/tags

# Check parser logs
docker logs event-parser

# Monitor processing
tail -f /var/log/event-parser.log
```

### Common Issues

1. **Ollama Connection Failed**:
   - Verify Ollama is running: `ollama serve`
   - Check firewall settings
   - Ensure model is pulled: `ollama pull llama3.1:8b`

2. **Low Parse Confidence**:
   - Review email formats in logs
   - Update regex patterns if needed
   - Adjust confidence thresholds

3. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check network connectivity
   - Review RLS policies

4. **Memory Issues**:
   - Monitor Ollama memory usage
   - Consider using smaller models for resource-constrained environments
   - Implement request queuing

### Performance Tuning

- **Batch Processing**: Adjust batch size in `_get_unprocessed_emails()`
- **Ollama Timeout**: Modify timeout based on model performance
- **Retry Logic**: Adjust retry attempts and backoff strategy
- **Model Selection**: Use different Ollama models based on accuracy/speed requirements

## API Reference

### Main Classes

#### `EventParser`
Main service class that orchestrates the parsing process.

#### `RegexParser`
Handles pattern-based extraction from email content.

#### `OllamaClient`
Manages communication with the local Ollama instance.

#### `ParsedEvent`
Data class representing a structured event.

### Key Methods

- `parse_queue()`: Main processing loop
- `_process_email()`: Process individual email with retry logic
- `_parse_with_ollama()`: LLM-based parsing fallback
- `_find_child_id()`: Match events to children

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.