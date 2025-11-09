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


### Deploy

```
docker build -t lucinka .

docker save -o /tmp/lucinka-docker.tar lucinka:latest

scp /tmp/lucinka-docker.tar tomas@46.62.136.60:/home/tomas/lucinka-docker.tar
```

now ssh into it

```
ssh tomas@<TOMAS IP>

tmux a -t 0

sudo docker load -i lucinka-docker.tar
```

In the window above ctrl C and wait to stop and run

`docker compose up`

In the window below

`docker image prune`