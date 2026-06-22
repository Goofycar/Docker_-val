# TP3 Docker — Conteneurisation de TaskFlow

TP réalisé dans le cadre du cours DevOps — Ynov B3 2025/2026.

L'objectif est de conteneuriser une application de gestion de tâches pour qu'elle soit lancée entièrement avec une seule commande Docker Compose.

---

## Lancer la stack

```bash
docker compose up --build
```

---

## Services

| Service | URL | Rôle |
|---------|-----|------|
| Frontend | http://localhost:8080 | Interface web (Nginx) |
| Backend | http://localhost:3001 | API Node.js |
| Cache | interne uniquement | Redis (non exposé) |

---

## Etape 1 — Dockerfile backend

Fichier : `backend/Dockerfile`

- Image `node:20-alpine`
- `package.json` copié en premier pour exploiter le cache Docker
- `npm install --omit=dev` pour ne pas embarquer les devDependencies
- `USER node` pour ne pas tourner en root
- Port exposé : 3001

---

## Etape 2 — Dockerfile frontend

Fichier : `frontend/Dockerfile`

- Image `nginx:alpine`
- Copie `index.html` dans le dossier servi par Nginx
- Port exposé : 80

---

## Etape 3 — Docker Compose

Fichier : `docker-compose.yml`

- `frontend` : build `./frontend`, accessible sur le port 8080
- `backend` : build `./backend`, accessible sur le port 3001, reçoit `REDIS_HOST` et `REDIS_PORT` en variables d'environnement, `restart: on-failure` pour attendre que Redis soit prêt
- `cache` : image `redis:7-alpine`, **aucun port publié**, volume nommé `redis_data` pour la persistance

Redis est uniquement joignable par le backend via le nom de service `cache` sur le réseau interne `taskflow-net`.

---

## Etape 4 — .env.example et .dockerignore

`.env.example` contient le template des variables sans valeurs sensibles.

`.dockerignore` exclut `node_modules`, `.env`, `.git` et les logs du contexte de build.

---

## Vérifications

```bash
# Les 3 services doivent être Up
docker compose ps

# Backend
curl http://localhost:3001/health
# → {"status":"ok"}

# Redis non exposé
# Pas de ports: sur le service cache dans docker-compose.yml

# Persistance des tâches
docker compose down
docker compose up -d
# → Les tâches sont toujours là sur http://localhost:8080
```
