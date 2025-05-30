FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Use the PORT environment variable
CMD ["sh", "-c", "node dist/main.js --port ${PORT}"]