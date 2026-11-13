# ---------------------------------------------------------------------------
# Flight service - port 8081
# Build context: mohammed/backend
#   docker build -t flight-service ./mohammed/backend
# ---------------------------------------------------------------------------
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# The process never runs as root.
USER node

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||'8081')+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
