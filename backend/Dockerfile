FROM python:3.9

WORKDIR /app/server
COPY ./*.txt ./
RUN pip install --no-cache-dir -r torch-requirements.txt --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
COPY ./ ./
COPY model.ckpt .

EXPOSE 80

CMD ["python", "app.py", "--model-path", "./model.ckpt", "--port", "80"]
