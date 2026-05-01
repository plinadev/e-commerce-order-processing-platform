FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/ ./services/api-gateway/

RUN npm install --workspace=services/api-gateway

WORKDIR /app/services/api-gateway
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
