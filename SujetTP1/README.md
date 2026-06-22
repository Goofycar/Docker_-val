# TP1 Docker — Réparer une image cassée

TP réalisé dans le cadre du cours DevOps — Ynov B3 2025/2026.

L'objectif est d'identifier et corriger les problèmes d'un Dockerfile non sécurisé et mal optimisé.

---

## Lancer l'application

```bash
docker build -t tp1:corrige .
docker run -p 3000:3000 tp1:corrige
```

Ouvrir [localhost:3000](http://localhost:3000)

---

## Problèmes identifiés (Dockerfile original)

### 1. Secrets hardcodés — lignes 6-8
Les variables `API_KEY`, `DB_PASSWORD` et `DB_HOST` sont écrites en dur dans le Dockerfile.  
N'importe qui avec accès à l'image peut les lire via `docker inspect`.

### 2. Mauvais ordre des instructions — ligne 12
`COPY . .` est placé avant `RUN npm install`.  
Le cache npm est invalidé à chaque modification de code, même si `package.json` n'a pas changé.

### 3. DevDependencies inutiles — ligne 15
`npm install` sans `--omit=dev` installe `nodemon`, qui ne sert qu'en développement.

### 4. Outils inutiles — lignes 19-25
`vim`, `git`, `htop`, `net-tools` sont installés sans raison.  
Résultat : image plus lourde et surface d'attaque augmentée.

### 5. Image de base trop lourde — ligne 1
`node:18` est basée sur Debian (~900MB).  
L'image finale dépasse largement les 200MB et embarque des centaines de packages inutiles.

### 6. Container en root — aucune directive USER
Sans `USER`, le process tourne en root à l'intérieur du container.  
En cas de compromission, l'attaquant obtient les droits root.

---

## Corrections apportées

- `FROM node:18` remplacé par `FROM node:18-alpine`
- Ordre corrigé : `COPY package.json` → `npm install` → `COPY index.js`
- `npm install --omit=dev` pour ne pas embarquer les devDependencies
- Bloc `apt-get` supprimé
- Secrets retirés — à injecter au runtime : `docker run --env-file .env tp1:corrige`
- `USER node` ajouté pour ne pas tourner en root

---

## Bonus

- `.dockerignore` ajouté pour exclure `node_modules`, `.env`, `*.docx` du contexte de build
- `Dockerfile.multistage` : version multi-stage qui copie uniquement `dist/index.js` dans l'image finale

---

## Vérifications

```bash
# Taille de l'image (doit être < 200MB)
docker images tp1:corrige

# Vérifier que le container ne tourne pas en root
docker run --rm tp1:corrige whoami
# → doit afficher "node"

# Vérifier qu'aucun secret n'est dans l'image
docker inspect tp1:corrige
# → section Env ne doit pas contenir API_KEY ni DB_PASSWORD
```
