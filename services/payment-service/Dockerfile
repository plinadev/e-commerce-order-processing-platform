FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY shared/ ./shared/
COPY services/payment-service/ ./services/payment-service/

RUN npm install --workspace=shared --workspace=services/payment-service
RUN npm run build --workspace=shared

WORKDIR /app/services/payment-service
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
