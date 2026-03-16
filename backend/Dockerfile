FROM python:3.11-slim
WORKDIR /app

# Install dependencies แยกก่อนเพื่อใช้ประโยชน์จาก Docker Cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

ENV FLASK_APP=run.py

# ใช้ Gunicorn สำหรับ Production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]