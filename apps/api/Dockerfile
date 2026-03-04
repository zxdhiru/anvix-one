# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
