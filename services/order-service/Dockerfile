FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/order-service/ ./services/order-service/

RUN npm install --workspace=shared --workspace=services/order-service
RUN npm run generate --workspace=shared
RUN npm run build --workspace=shared

WORKDIR /app/services/order-service
RUN npx tsc -p tsconfig.build.json

ENV NODE_ENV=production
CMD ["node", "dist/src/index.js"]
