# TP2 Docker Compose — Stack multi-services

TP réalisé dans le cadre du cours DevOps — Ynov B3 2025/2026.

L'objectif est d'orchestrer plusieurs services avec Docker Compose : une API Node.js, une base PostgreSQL, un frontend Nginx et Adminer.

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
| API | http://localhost:3000 | API Node.js |
| Adminer | http://localhost:8081 | Interface admin PostgreSQL |
| Database | interne uniquement | PostgreSQL (non exposé) |

---

## Etape 1 — Docker Compose

Le fichier `docker-compose.yml` définit les 4 services sur un réseau commun `tp2-net`.

- `database` utilise l'image officielle `postgres:16-alpine`, aucun port n'est publié sur la machine hôte
- `api` est buildée depuis `./api`, expose le port 3000, et a `restart: on-failure` pour gérer le démarrage avant que PostgreSQL soit prêt
- `frontend` est buildée depuis `./frontend`, accessible sur le port 8080
- `adminer` utilise l'image officielle, accessible sur le port 8081

---

## Etape 2 — Volumes et secrets

### Volume

Un volume nommé `db_data` est déclaré pour persister les données PostgreSQL entre les redémarrages.

```bash
docker compose down
docker compose up -d
# Les messages sont toujours là
```

### Fichier .env

Aucun mot de passe n'apparaît en clair dans `docker-compose.yml`. Les valeurs sensibles sont dans `.env`.

```bash
grep -i password docker-compose.yml
# Résultat : ${DB_PASSWORD} — jamais la vraie valeur
```

---

## Etape 3 — Adminer

Adminer est le 4e service de la stack. Il se connecte à `database` via le réseau Docker interne.

Connexion sur http://localhost:8081 :
- Système : PostgreSQL
- Serveur : `database`
- Utilisateur : `tp2user`
- Mot de passe : valeur de `DB_PASSWORD` dans `.env`
- Base : `tp2db`

---

## Vérifications

```bash
# Frontend
# http://localhost:8080 affiche la page

# API
curl http://localhost:3000/health
# → {"status":"ok"}

# Base de données non exposée
# localhost:5432 ne répond pas

# Pas de secrets en dur
grep -i password docker-compose.yml
# → uniquement ${DB_PASSWORD}
```
