FROM node:20.18.0-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20.18.0-alpine AS production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY --from=build /usr/src/app/build ./build

# COPY public ./public
COPY . .
COPY .env ./

# EXPOSE 3000

CMD ["npm", "start"]