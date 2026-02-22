FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Must match the port in vite.config.ts (5170)
EXPOSE 5170

# Run Vite dev server on 0.0.0.0 so it's accessible outside the container
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5170"]
