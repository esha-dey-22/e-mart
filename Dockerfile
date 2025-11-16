# Simple static site image
FROM nginx:alpine
COPY . /usr/share/nginx/html
# Optional: remove default nginx index if present (safe)
RUN rm -f /usr/share/nginx/html/default.conf || true
# Expose port 80
EXPOSE 80
