FROM node:22 as builder
WORKDIR /app/client
COPY client/ ./
RUN npm install
RUN npm run build


FROM python:3.9
WORKDIR /app/server
COPY server/ ./
RUN pip install --no-cache-dir -r requirements.txt
COPY --from=builder /app/client/static ./static

EXPOSE 80

CMD ["python", "app.py", "--static-path", "/app/server/static", "--model-path", "./model.ckpt", "--port", "80"]
