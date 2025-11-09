# Use Python 3.11 on Alpine for a smaller base image
FROM python:3.11-alpine
 
# Set the container's working directory
WORKDIR /app
 
# Copy only the requirements file first to leverage caching
COPY requirements.txt .
 
# Install Python libraries
RUN pip install -r requirements.txt
 
# Copy the rest of the application code
COPY . .
RUN apk add --no-cache dos2unix
RUN dos2unix start.sh
RUN chmod +x start.sh
#Exposing Flask port for local development
EXPOSE 5000

# Run the Flask app
#CMD ["python", "app.py"]
#Run the startup script as we need to load the database first and then run flask app
CMD ["sh", "start.sh"]