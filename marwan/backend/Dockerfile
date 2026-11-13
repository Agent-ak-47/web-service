# ---------------------------------------------------------------------------
# Excursion service - port 8084
# Build context: marwan/backend
#   docker build -t excursion-service ./marwan/backend
# ---------------------------------------------------------------------------
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# Uploaded covers are written here; a compose volume keeps them across restarts.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

# The process never runs as root.
USER node

EXPOSE 8084

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||'8084')+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
