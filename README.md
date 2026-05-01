# QuizzyNote

AI-powered learning system. Architecture spec: [Claude.md](Claude.md).

## One-time setup

### 1. Fill in `.env`

```bash
cp .env.example .env
```

Then edit `.env`:

- `JWT_SECRET` — generate with `python -c "import secrets; print(secrets.token_hex(32))"`
- `GROQ_API_KEY` — https://console.groq.com/keys
- `HF_TOKEN` — https://huggingface.co/settings/tokens
- `PINECONE_API_KEY` — https://app.pinecone.io

### 2. Python environment

```bash
python -m venv .venv
source .venv/Scripts/activate    # Windows bash / Git Bash
# .venv\Scripts\Activate.ps1     # PowerShell
# .venv\Scripts\activate.bat     # cmd
pip install -r backend/requirements.txt
```

### 3. Start Postgres

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Create the Pinecone index

```bash
python scripts/create_pinecone_index.py
```

## Run the API

```bash
cd backend
uvicorn app.main:app --reload
```

Visit http://localhost:8000/healthz — all four checks (`postgres`, `pinecone`, `llm`, `embeddings`) should return `ok`.

## Layout

See [Claude.md § PROJECT STRUCTURE](Claude.md).
