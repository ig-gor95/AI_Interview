# AI HR Interview Backend

Backend API for AI-powered HR interview system with live voice dialog and candidate evaluation.

## Features

- 🎤 Live voice interview via WebSocket
- 🤖 AI-powered candidate evaluation using multiple analyzers
- 📊 Modular analyzer architecture for speech and content analysis
- 🗄️ PostgreSQL database with async SQLAlchemy
- 🐳 Docker & Docker Compose for easy deployment
- 🔐 JWT authentication
- 📝 Comprehensive candidate evaluation reports

## Architecture

The project follows Clean Architecture principles with modular analyzer system:

- **Analyzers**: Pluggable modules for different types of analysis (speech, content, behavior)
- **Services**: Business logic and orchestration
- **API**: FastAPI REST endpoints and WebSocket handlers
- **Models**: SQLAlchemy database models

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Setup

1. Clone the repository and navigate to backend directory:
```bash
cd backend
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY and other variables
```

3. Start services:
```bash
docker-compose up -d
```

4. Run database migrations (once database is ready):
```bash
docker-compose exec backend alembic upgrade head
```

5. Access the API:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Development

### Running without Docker

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database and configure `.env`

3. Run migrations:
```bash
alembic upgrade head
```

4. Start development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── analyzers/          # Analyzer modules
│   │   ├── base.py        # Base analyzer class
│   │   ├── registry.py    # Analyzer registry
│   │   ├── speech/        # Speech analyzers
│   │   ├── content/       # Content analyzers
│   │   └── behavior/      # Behavior analyzers
│   ├── api/               # API routes
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── websocket/         # WebSocket handlers
│   ├── config.py          # Configuration
│   ├── database.py        # Database setup
│   └── main.py            # FastAPI app
├── tests/                 # Tests
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Adding New Analyzers

1. Create analyzer class inheriting from `BaseAnalyzer`:
```python
from app.analyzers.base import BaseAnalyzer, AnalysisResult

class MyAnalyzer(BaseAnalyzer):
    @property
    def name(self) -> str:
        return "my_analyzer"
    
    async def analyze(self, audio_data, transcript, metadata):
        # Your analysis logic
        return AnalysisResult(...)
```

2. Register it in the registry (see `app/analyzers/__init__.py`)

3. Add to configuration in `.env`:
```
ENABLED_ANALYZERS=...,my_analyzer
```

## Environment Variables

See `.env.example` for all available environment variables.

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

## License

MIT

