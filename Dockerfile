FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY vite.config.js ./
COPY src ./src
COPY index.html ./
COPY public ./public

RUN npm ci
RUN npm run build

FROM python:3.13-alpine

WORKDIR /app

RUN apk add --no-cache uv

COPY --from=builder /app/dist ./static
COPY README.md ./
COPY lucinka ./lucinka
COPY docker-entrypoint.sh ./
COPY pyproject.toml ./
COPY alembic.ini ./
COPY uv.lock ./

RUN mkdir -p /app/db
RUN mkdir -p /app/db/photos

RUN uv pip install --system .

EXPOSE 5000

ENV SQLALCHEMY_DATABASE_URI=sqlite:////app/db/app.db
ENV STATIC_FOLDER=/app/static

CMD ["./docker-entrypoint.sh"]