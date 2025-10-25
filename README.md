# Lucinka

## Development

### Flask server

```sh
uv sync
source .venv/bin/activate
uv pip install -e .
lucinka debug
```

### Vite server

```sh
npm ci
npm run dev
```

### Migrate
1. `alembic revision -m "Description"`
2. write migration
3. `alembic upgrad head`
