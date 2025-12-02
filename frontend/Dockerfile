# Use lightweight nginx image
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy your frontend files into nginx html directory
COPY . /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# nginx will start automatically as default CMD
