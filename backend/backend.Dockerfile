# Этап сборки
FROM node:20-alpine as builder

WORKDIR /usr/src/app/badgi
COPY package*.json ./
COPY prisma ./prisma/

RUN apk add --no-cache openssl python3 make g++
RUN npm ci
RUN npm install -g @nestjs/cli
RUN npx prisma generate
COPY . .
RUN npm run build

# Финальный образ
FROM node:20-alpine

WORKDIR /usr/src/app/badgi

RUN apk add --no-cache openssl

COPY --from=builder /usr/src/app/badgi/node_modules ./node_modules
COPY --from=builder /usr/src/app/badgi/dist ./dist
COPY --from=builder /usr/src/app/badgi/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/badgi/package*.json ./
COPY --from=builder /usr/src/app/badgi/prisma ./prisma

CMD ["node", "dist/main"]