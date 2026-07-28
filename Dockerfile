# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - Nginx serving static files
FROM nginx:1.25-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/run && \
    chmod -R 755 /usr/share/nginx/html

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
