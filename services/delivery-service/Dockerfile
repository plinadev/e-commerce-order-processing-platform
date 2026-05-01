FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/delivery-service/ ./services/delivery-service/

RUN npm install --workspace=shared --workspace=services/delivery-service
RUN npm run generate --workspace=shared
RUN npm run build --workspace=shared

WORKDIR /app/services/delivery-service
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
