#!/bin/bash

# Event Parser - Ollama Setup Script
# Installs Ollama and pulls required models for event parsing

set -e

echo "🚀 Setting up Ollama for Event Parser Service"
echo "=============================================="

# Check if running on supported OS
if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script supports Linux and macOS only"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Ollama is already installed
if command_exists ollama; then
    echo "✅ Ollama is already installed"
    ollama --version
else
    echo "📦 Installing Ollama..."
    
    # Install Ollama
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux installation
        curl -fsSL https://ollama.ai/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS installation
        if command_exists brew; then
            brew install ollama
        else
            echo "❌ Homebrew not found. Please install Homebrew first or download Ollama manually from https://ollama.ai"
            exit 1
        fi
    fi
    
    echo "✅ Ollama installed successfully"
fi

# Start Ollama service in background
echo "🔄 Starting Ollama service..."

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # On Linux, start as background service
    nohup ollama serve > /dev/null 2>&1 &
    OLLAMA_PID=$!
    echo "🔧 Ollama service started with PID: $OLLAMA_PID"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # On macOS, start as background service
    brew services start ollama || {
        nohup ollama serve > /dev/null 2>&1 &
        OLLAMA_PID=$!
        echo "🔧 Ollama service started with PID: $OLLAMA_PID"
    }
fi

# Wait for service to be ready
echo "⏳ Waiting for Ollama service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama service is ready"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Ollama service failed to start within 30 seconds"
        exit 1
    fi
    
    sleep 1
done

# Pull required model
echo "📥 Pulling llama3.1:8b model (this may take several minutes)..."
ollama pull llama3.1:8b

# Verify model is available
echo "🔍 Verifying model installation..."
if ollama list | grep -q "llama3.1:8b"; then
    echo "✅ llama3.1:8b model installed successfully"
else
    echo "❌ Failed to install llama3.1:8b model"
    exit 1
fi

# Test model with a simple prompt
echo "🧪 Testing model with sample prompt..."
TEST_RESPONSE=$(ollama run llama3.1:8b "Hello, respond with just 'OK' if you can understand this." --timeout 10s)

if [[ "$TEST_RESPONSE" == *"OK"* ]]; then
    echo "✅ Model test successful"
else
    echo "⚠️  Model test completed but response was unexpected: $TEST_RESPONSE"
fi

# Create systemd service file for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]] && command_exists systemctl; then
    echo "🔧 Creating systemd service for Ollama..."
    
    sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=default.target
EOF

    # Create ollama user if it doesn't exist
    if ! id "ollama" &>/dev/null; then
        sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama
    fi

    sudo systemctl daemon-reload
    sudo systemctl enable ollama
    sudo systemctl start ollama
    
    echo "✅ Ollama systemd service created and started"
fi

# Display service information
echo ""
echo "🎉 Ollama Setup Complete!"
echo "========================"
echo "Service URL: http://localhost:11434"
echo "Model: llama3.1:8b"
echo ""
echo "Available commands:"
echo "  ollama list                    # List installed models"
echo "  ollama run llama3.1:8b         # Interactive chat"
echo "  ollama serve                   # Start service manually"
echo ""

# Health check
echo "🏥 Final health check..."
if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:8b"; then
    echo "✅ All systems ready! Event Parser can now use Ollama."
else
    echo "⚠️  Health check warning: Service may not be fully ready"
    echo "   Try running: ollama serve"
fi

echo ""
echo "📝 Next steps:"
echo "1. Set OLLAMA_BASE_URL=http://localhost:11434 in your .env file"
echo "2. Set OLLAMA_MODEL=llama3.1:8b in your .env file"
echo "3. Run the event parser: python parser/main.py"