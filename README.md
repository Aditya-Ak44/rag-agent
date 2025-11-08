# RAG Agent - Retrieval Augmented Generation with Vector Embeddings

A powerful full-stack application that lets you upload PDFs, create vector embeddings, and query them using a local LLM. Built with Next.js, Chroma DB, Ollama, and Docker. Everything runs in containers with **one command**.

## 🎯 What is RAG?

**RAG (Retrieval Augmented Generation)** combines document retrieval with LLM generation:

1. **Upload PDFs** → Documents are split into chunks
2. **Create Embeddings** → Chunks converted to vector representations
3. **Store in Vector DB** → Embeddings stored in Chroma DB for fast search
4. **Query** → Your question gets converted to embedding and matched against stored vectors
5. **Generate** → Top matching documents sent to LLM (Ollama) to generate answers

## ✨ Features

✅ **PDF Upload & Processing** - Upload multiple PDFs at once  
✅ **Vector Store Management** - Create, view, and delete vector stores  
✅ **Multiple Embedding Models** - Choose from various Ollama embedding models  
✅ **Semantic Search** - Find relevant documents using vector similarity  
✅ **Local LLM Integration** - Use Ollama qwen2:7b for on-device inference  
✅ **Beautiful UI** - Modern React interface with Tailwind CSS  
✅ **Docker Support** - Everything in containers, one command to start  
✅ **Persistent Storage** - Vector stores persist across sessions  
✅ **Document Citations** - Answers cite source documents  
✅ **Mac Compatible** - Optimized for macOS with Docker Desktop

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Next.js Frontend (React + UI)     │
│  - Upload PDFs                      │
│  - Create vector stores             │
│  - Query documents                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│   Next.js API Routes (Node.js)       │
│  - /api/create-store (POST)          │
│  - /api/query (POST)                 │
│  - /api/vector-stores (GET/DELETE)   │
└──────────────┬──────────────────────┘
               │
        ┌──────┼──────┐
        ↓      ↓      ↓
   ┌────────┐ ┌────────┐ ┌──────────┐
   │ Chroma │ │ Ollama │ │Embedding │
   │ DB     │ │ LLM    │ │ Models   │
   └────────┘ └────────┘ └──────────┘
        ↑          ↑           ↑
   Vectors    qwen2:7b   nomic-embed-text
```

## 📋 Prerequisites

- **Docker Desktop** - For all services ([download](https://www.docker.com/products/docker-desktop))
- **Mac with at least 8GB RAM** - For running Docker containers smoothly
- That's it! Everything else runs in Docker

## 🚀 Quick Start (2 Commands)

### Step 1: Copy Docker Files

Clone the repository and make sure you have:
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### Step 2: Start Everything

```bash
docker-compose up -d
```

### Step 3: Pull Models (First Time Only)

In a new terminal:

```bash
# Pull LLM model (required for answering questions)
docker exec rag-ollama ollama pull qwen2:7b

# Pull embedding model (required for creating vectors)
docker exec rag-ollama ollama pull nomic-embed-text
```

⏱️ **First time takes 5-10 minutes** to download ~5GB of models.

### Step 4: Open Your Browser

```
http://localhost:3000
```

Done! 🎉

## 📊 What's Running

After `docker-compose up -d`, you have:

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Next.js App** | http://localhost:3000 | 3000 | Web UI |
| **Chroma DB** | http://localhost:8000 | 8000 | Vector storage |
| **Ollama** | http://localhost:11434 | 11434 | LLM & embeddings |

## 📝 Project Structure

```
rag-agent/
├── Dockerfile                  # Build Next.js app image
├── docker-compose.yml          # Orchestrate all services
├── .dockerignore               # Files to exclude from image
├── entrypoint.sh              # Optional: Auto-pull models
├── app/
│   ├── api/
│   │   ├── create-store/
│   │   │   └── route.ts       # POST - Create vector store
│   │   ├── query/
│   │   │   └── route.ts       # POST - Query documents
│   │   └── vector-stores/
│   │       ├── route.ts       # GET all stores
│   │       └── [id]/
│   │           └── route.ts   # DELETE store
│   ├── globals.css            # Tailwind styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main UI component
├── chroma_data/               # Metadata (auto-created)
├── .env.local                 # Environment variables
└── package.json
```

## 🎮 How to Use

### 1. Create a Vector Store

1. Open http://localhost:3000
2. Click **"Create Store"** tab
3. Enter store name (e.g., "Company Docs")
4. Select embedding model:
   - `nomic-embed-text` ⭐ **Recommended** (fast & good quality)
   - `all-minilm` (fastest, small size)
   - `mxbai-embed-large` (best quality, slowest)
5. Upload 1+ PDF files
6. Click **"Create Vector Store"**
7. Wait for processing (shows progress in terminal logs)

### 2. Query Your Documents

1. Click **"Query"** tab
2. Select a vector store from the left panel
3. Type your question
4. Click **"Get Answer"**
5. View the LLM-generated answer with citations

### 3. Manage Stores

- **View**: All stores listed in left panel with metadata
- **Delete**: Click trash icon next to store name
- **Info**: Shows creation date, file count, embedding model used

## ⚙️ Configuration

### Environment Variables

Edit `.env.local` to customize:

```env
# Next.js App
NEXT_PUBLIC_API_URL=http://localhost:3000

# Chroma DB
CHROMA_URL=http://chroma:8000

# Ollama LLM
OLLAMA_BASE_URL=http://ollama:11434
```

### Embedding Models

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `nomic-embed-text` | 274MB | ⚡ Fast | ⭐⭐⭐⭐ Very Good | General use |
| `all-minilm` | 60MB | ⚡⚡ Fastest | ⭐⭐⭐ Good | Quick searches |
| `mxbai-embed-large` | 650MB | 🐢 Slow | ⭐⭐⭐⭐⭐ Excellent | High accuracy |

Pull additional models:

```bash
docker exec rag-ollama ollama pull all-minilm
docker exec rag-ollama ollama pull mxbai-embed-large
```

### LLM Models

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `qwen2:7b` | 4.7GB | ⚡ Medium | ⭐⭐⭐⭐ Very Good | **Default** |
| `neural-chat:7b` | 4.1GB | ⚡⚡ Fast | ⭐⭐⭐ Good | Speed priority |
| `mistral:7b` | 5.0GB | 🐢 Slow | ⭐⭐⭐⭐⭐ Excellent | Quality priority |
| `dolphin-mixtral` | 27GB | 🐢🐢 Very Slow | ⭐⭐⭐⭐⭐ Best | Maximum quality |

Pull different LLM:

```bash
docker exec rag-ollama ollama pull mistral:7b
```

To use it, edit `app/api/query/route.ts`:

```typescript
const response = await ollama.generate({
  model: "mistral:7b",  // Change this line
  prompt: augmentedPrompt,
  system: systemPrompt,
  stream: false,
});
```

## 🛑 Stop / Start / Restart

```bash
# Stop all containers (keeps data)
docker-compose stop

# Start again
docker-compose start

# Restart all containers
docker-compose restart

# Stop and remove containers (keeps data in volumes)
docker-compose down

# Remove everything including data (fresh start)
docker-compose down -v
```

## 📊 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f rag-app
docker-compose logs -f chroma
docker-compose logs -f ollama

# Last 50 lines
docker-compose logs --tail 50
```

## 🔍 Status Checks

```bash
# See running containers
docker-compose ps

# Check Ollama status
docker exec rag-ollama ollama list

# Check Chroma heartbeat
curl http://localhost:8000/api/v1/heartbeat

# Check Next.js app
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Models Not Downloaded

```bash
# Check what models are available
docker exec rag-ollama ollama list

# Pull missing models
docker exec rag-ollama ollama pull qwen2:7b
docker exec rag-ollama ollama pull nomic-embed-text
```

### "Connection refused" on Chroma (8000)

```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs chroma

# Restart
docker-compose restart chroma
```

### "Cannot connect to Ollama" Error

```bash
# Wait a bit longer (Ollama takes 20-30 seconds to start)
sleep 30

# Check if running
docker exec rag-ollama ollama list

# View logs
docker-compose logs ollama

# Restart if needed
docker-compose restart ollama
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Change port in docker-compose.yml
# ports:
#   - "8080:3000"  # Use 8080 instead
```

### Slow Responses

- **First query is slow** (model initialization takes 20-30 seconds)
- Use faster embedding model: `nomic-embed-text`
- Use faster LLM: `neural-chat:7b`
- Reduce `topK` in query (default is 3)

### "No relevant documents found"

- Verify PDFs were uploaded (check left panel)
- Try different query wording
- Make sure embedding model pulled successfully
- Check logs: `docker-compose logs rag-app`

### Out of Disk Space

Models are large (5GB+ total):
- Check available space: `df -h`
- Remove old images: `docker image prune -a`
- Remove unused volumes: `docker volume prune`

## 📦 Data Storage

- **Metadata**: `./chroma_data/` (JSON files, ~1MB)
- **Vector Embeddings**: Docker volume `chroma_data` (grows with documents)
- **Ollama Models**: Docker volume `ollama_data` (5GB+)
- **Temporary Files**: Deleted after store creation

### Backup

```bash
# Backup metadata
cp -r chroma_data backup_chroma_data/

# Backup everything (requires Docker)
docker-compose exec chroma tar czf - /chroma/data > backup_chroma.tar.gz
```

### Reset Everything

```bash
# Stop and delete all data
docker-compose down -v

# Start fresh
docker-compose up -d
docker exec rag-ollama ollama pull qwen2:7b
docker exec rag-ollama ollama pull nomic-embed-text
```

## 🚀 Performance Optimization

### For Faster Responses

1. Use smaller embedding model: `nomic-embed-text`
2. Use faster LLM: `neural-chat:7b`
3. Reduce chunk size in `app/api/create-store/route.ts`:
   ```typescript
   const splitter = new RecursiveCharacterTextSplitter({
     chunkSize: 1000,    // Reduce from 2000
     chunkOverlap: 200,
   });
   ```

### For Better Quality

1. Use larger embedding model: `mxbai-embed-large`
2. Use better LLM: `mistral:7b` or `dolphin-mixtral`
3. Increase chunk overlap for better context

### System Requirements by Model

| Model | RAM | Disk | Speed on Mac |
|-------|-----|------|-------------|
| `nomic-embed-text` | 2GB | 300MB | ⚡ 1-2 sec |
| `qwen2:7b` | 8GB | 5GB | ⚡⚡ 5-10 sec |
| `mxbai-embed-large` | 4GB | 700MB | 🐢 5-10 sec |
| `dolphin-mixtral` | 32GB | 27GB | 🐢🐢 30+ sec |

## 🌐 Access from Other Machines

To access from another Mac/computer on same network:

1. Get your Mac's IP: `ipconfig getifaddr en0`
2. Replace `localhost` with that IP in docker-compose.yml:
   ```yaml
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3000
   ```
3. Restart: `docker-compose up -d`
4. Access from other machine: `http://192.168.1.100:3000`

## 🚢 Deployment

### Deploy to Production

1. **Server Requirements**:
   - Linux VPS (Ubuntu 20.04+)
   - 16GB+ RAM for models
   - 50GB+ disk space
   - Docker and Docker Compose installed

2. **Clone and Setup**:
   ```bash
   git clone <repo> rag-agent
   cd rag-agent
   docker-compose up -d
   docker exec rag-ollama ollama pull qwen2:7b
   docker exec rag-ollama ollama pull nomic-embed-text
   ```

3. **Add Reverse Proxy (Nginx)**:
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;
     location / {
       proxy_pass http://localhost:3000;
     }
   }
   ```

4. **SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```

## 📚 Technologies Used

- **Frontend**: [Next.js 14](https://nextjs.org) - React framework
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility CSS
- **Vector DB**: [Chroma](https://trychroma.com) - Vector store
- **LLM**: [Ollama](https://ollama.ai) - Local inference
- **PDF Parsing**: [@langchain/community](https://js.langchain.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Containerization**: [Docker](https://docker.com) & [Docker Compose](https://docs.docker.com/compose/)

## 📖 Learn More

- [LangChain JS Docs](https://js.langchain.com)
- [Chroma Docs](https://docs.trychroma.com)
- [Ollama GitHub](https://github.com/jmorganca/ollama)
- [Ollama Model Library](https://ollama.ai/library)
- [Next.js Docs](https://nextjs.org/docs)
- [RAG Explained](https://www.deeplearning.ai/short-courses/retrieval-augmented-generation-rag/)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙋 Support

For issues or questions:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review [GitHub Issues](https://github.com/yourusername/rag-agent/issues)
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Output from `docker-compose ps`
   - Output from `docker-compose logs`

## 🎉 Quick Reference

```bash
# Start everything
docker-compose up -d

# Pull models (first time only)
docker exec rag-ollama ollama pull qwen2:7b
docker exec rag-ollama ollama pull nomic-embed-text

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Pull more models
docker exec rag-ollama ollama pull mistral:7b
docker exec rag-ollama ollama pull all-minilm

# Access app
http://localhost:3000
```

---

**Built with ❤️ for local AI workflows** 🚀

Questions? Open an issue or check the docs!