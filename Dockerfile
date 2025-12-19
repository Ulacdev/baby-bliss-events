FROM php:8.2-cli

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    nginx \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip pdo pdo_mysql mysqli

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY api/ /var/www/html/

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Copy nginx configuration
COPY --from=nginx:alpine /etc/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=nginx:alpine /etc/nginx/conf.d /etc/nginx/conf.d

# Create nginx config for PHP
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    root /var/www/html;\
    index index.php;\
    \
    location / {\
        try_files $uri $uri/ /index.php?$query_string;\
    }\
    \
    location ~ \.php$ {\
        fastcgi_pass 127.0.0.1:9000;\
        fastcgi_index index.php;\
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\
        include fastcgi_params;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose port 80
EXPOSE 80

# Start PHP-FPM and Nginx
CMD php -S 0.0.0.0:80 -t /var/www/html