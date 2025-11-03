.PHONY: up down rebuild logs-diag logs-fe

up:
docker compose up

down:
docker compose down -v

rebuild:
docker compose down -v
docker compose build --no-cache
docker compose up

logs-diag:
docker compose logs -f diagnosis_web

logs-fe:
docker compose logs -f superlingo_fe_web
