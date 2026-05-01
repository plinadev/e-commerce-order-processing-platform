FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/payment-service/ ./services/payment-service/

RUN npm install --workspace=shared --workspace=services/payment-service
RUN npm run generate --workspace=shared
RUN npm run build --workspace=shared

WORKDIR /app/services/payment-service
RUN npx tsc -p tsconfig.build.json

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
