FROM node:22 as builder
WORKDIR /app/client
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build

FROM caddy:2.8 as server
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/client/build /srv

EXPOSE 80
