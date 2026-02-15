# OmniSyn - Multimodal RAG Learning Assistant

> An AI-powered learning assistant that transforms study materials 
> into a intelligent, searchable knowledge base using Retrieval-Augmented Generation (RAG) , vector embeddings, and LLMs.

Instead of relying on keysearch OmniSyn understands the meaning of your content by:

OCR extracting text automatically -> CLIP embeddings for semantic understanding -> AI answers using YOUR OWN notes with citations 

## Key Features
- OCR text extraction from images/PDFs
- CLIP embeddings for semantic search
- Conversational AI with context-aware responses
- Dockerized microservices architecture
- Vector similarity search with PostgreSQL

![gif]([https://github.com/user-attachments/assets/248f0159-b2af-4cc0-abe0-c683205d7e1e])
```text

OmniSyn: RAG-based OCR & Search Architecture
===========================================

PHASE 1: INGESTION (OCR & EMBEDDING)
------------------------------------
USER              NEXT.JS (WEB)        POSTGRES (DB)       AI WORKER (EXPRESS)
  |                  |                    |                    |
  |-- 1. Upload ---->|                    |                    |
  |   (Image/PDF)    |-- 2. Create Note ->|                    |
  |                  |      (Status: 'Processing')             |
  |                  |                    |                    |
  |                  |-- 3. POST /process (Base64) ----------->|
  |                  |                    |                    |
  |                  |                    |-- 4. OCR (Tesseract)
  |                  |                    |-- 5. Embed (CLIP)
  |                  |                    |                    |
  |                  |                    |<-- 6. Update Note -|
  |                  |                    |    (Status: 'Completed')
  |<-- 7. Success ---|                    |                    |
  |                  |                    |                    |


PHASE 2: VECTOR SEARCH
----------------------
USER              NEXT.JS (WEB)        POSTGRES (DB)       AI WORKER (EXPRESS)
  |                  |                    |                    |
  |-- 1. Search ---->|                    |                    |
  |   "Query Text"   |-- 2. POST /embed ---------------------->|
  |                  |                                         |
  |                  |<-- 3. 512-dim Vector -------------------|
  |                  |                    |                    |
  |                  |-- 4. Cosine Similarity Query ---------->|
  |                  |      (pgvector <->)                     |
  |                  |                    |                    |
  |<-- 5. Top Results|                    |                    |
  |                  |                    |                    |


PHASE 3: AI CHAT (RAG)
----------------------
USER              NEXT.JS (WEB)        CLAUDE API          POSTGRES (DB)
  |                  |                    |                    |
  |-- 1. Question -->|                    |                    |
  |                  |-- 2. Search Context ------------------->|
  |                  |                                         |
  |                  |<-- 3. Top 3 Matching Note Fragments ----|
  |                  |                    |                    |
  |                  |-- 4. Context + Question --------------->|
  |                  |      (Prompt Engineering)               |
  |                  |                    |                    |
  |                  |<-- 5. AI Response (Stream) -------------|
  |<-- 6. Answer ----|                    |                    |
  |      + Citations |                    |                    |

```

## Tech Stack
**Frontend:** Next.js 15, TypeScript, React
**Backend:** Node.js, Express, Prisma
**AI/ML:** Transformers.js, Tesseract.js, Claude API
**Database:** PostgreSQL with pgvector
**DevOps:** Docker, Docker Compose

## System Design Highlights
- Microservices architecture with inter-service communication
- Multi-stage Docker builds (65% smaller images)
- Vector similarity search using cosine distance
- RAG pipeline with 512-dimensional CLIP embeddings

## Quick Start

**Clone the repository**
```bash
1. git clone and cd into omnisyn
```
2. **Set up environment variables**
```bash
# Copy example env file
touch .env

# Add your own credentials
nano .env
```

Required variables:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
ANTHROPIC_API_KEY="sk-ant-..."
WORKER_URL="http://worker:3001"
```

3. **Start with Docker**
```bash
# Build and start all services
docker-compose up --build
# App will be available at http://localhost:3000

## Future Enhancements
- User authentication with NextAuth
- Real-time collaboration features
- Cloud deployment with CI/CD

## Acknowledgements
- Inspired by Google NotebookLM
- **Anthropic** for Claude API
- **Hugging Face** for Transformers.js
- **Tesseract** for OCR capabilities
- **OpenAI** for CLIP architecture inspiration
