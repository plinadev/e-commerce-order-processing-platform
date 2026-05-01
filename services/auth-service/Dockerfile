FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/auth-service/ ./services/auth-service/

RUN npm install --workspace=shared --workspace=services/auth-service
RUN npm run generate --workspace=shared
RUN npm run build --workspace=shared

WORKDIR /app/services/auth-service
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/src/index.js"]
