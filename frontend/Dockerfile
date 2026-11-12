# ---------------------------------------------------------------------------
# Angular frontend - port 80 inside the container, published as 4200.
# Build context: frontend
#   docker build -t travel-agency-frontend ./frontend
# ---------------------------------------------------------------------------

# ============================== build stage ================================
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first: this layer is cached until package.json/lock change.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Sources, then the production build (tests are not run inside the image).
COPY . .
RUN npm run build -- --configuration production

# ============================= runtime stage ===============================
# Nginx serves the static files and falls back to index.html for Angular routes.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1/" || exit 1

CMD ["nginx", "-g", "daemon off;"]
