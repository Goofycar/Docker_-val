FROM node:18-alpine

WORKDIR /app

# 1. Copier package.json EN PREMIER pour exploiter le cache Docker :
#    npm install ne sera relancé que si package.json change, pas à chaque modif de code.
COPY package.json ./

# 2. Installer uniquement les dépendances de production (pas nodemon ni autres devDeps)
RUN npm install --omit=dev

# 3. Copier le code source APRÈS l'install
COPY index.js ./

# 4. Build minimal (copie vers dist/) + chown pour l'utilisateur non-root
RUN npm run build && chown -R node:node /app

EXPOSE 3000

# 5. Ne jamais tourner en root
USER node

# Les secrets (API_KEY, DB_PASSWORD, DB_HOST) ne doivent PAS être dans l'image.
# Les passer au runtime : docker run --env-file .env tp1:corrige
CMD ["node", "dist/index.js"]
