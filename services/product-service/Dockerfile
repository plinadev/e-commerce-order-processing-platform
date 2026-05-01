FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/product-service/ ./services/product-service/

RUN npm install --workspace=shared --workspace=services/product-service
RUN npm run build --workspace=shared

WORKDIR /app/services/product-service
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/src/index.js"]
