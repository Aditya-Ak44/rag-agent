#!/bin/bash
# entrypoint.sh - Auto-pull Ollama models on startup

# Start Ollama in the background
/bin/ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
sleep 10

# Pull required models
echo "Pulling qwen2:7b..."
/bin/ollama pull qwen2:7b

echo "Pulling nomic-embed-text..."
/bin/ollama pull nomic-embed-text

echo "All models pulled successfully!"

# Keep the container running
wait $OLLAMA_PID