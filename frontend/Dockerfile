# Dockerfile for React frontend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the production React app
RUN npm run build

# Install serve to serve frontend
RUN npm install -g serve

EXPOSE 5173

# Serve the build folder
CMD ["serve", "-s", "dist", "-l", "5173"]