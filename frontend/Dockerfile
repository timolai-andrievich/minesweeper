FROM node:22 as builder
WORKDIR /app/
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build

FROM caddy:2.8 as server
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist/ /srv/
EXPOSE 80
