FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY keycloak.json ./keycloak.json

EXPOSE 5000

CMD ["node", "src/server.js"]
