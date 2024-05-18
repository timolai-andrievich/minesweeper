FROM node:22 as builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build


FROM python:3.9
WORKDIR /app/server
COPY server/*.txt ./
RUN pip install --no-cache-dir -r torch-requirements.txt --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
COPY server/ ./
COPY --from=builder /app/client/build ./static
COPY model.ckpt .

EXPOSE 80

CMD ["python", "app.py", "--static-path", "/app/server/static", "--model-path", "./model.ckpt", "--port", "80"]
