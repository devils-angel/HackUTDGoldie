# Node.js backend image
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5003

CMD ["npm", "run", "start:seed"]
