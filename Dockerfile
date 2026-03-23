FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 5000

CMD ["npm", "start"]
