# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

# Create required directories
RUN mkdir -p logs data

# The server reads PORT from env (default 5000, set to 1000 via .env)
EXPOSE 1000

CMD ["npm", "start"]
