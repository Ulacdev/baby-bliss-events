FROM php:8.2-apache

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip pdo pdo_mysql mysqli

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache rewrite module
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY api/ /var/www/html/

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create startup script to configure Apache at runtime
RUN echo '#!/bin/bash\n\
# Configure Apache to listen on the PORT environment variable\n\
echo "Listen ${PORT:-80}" > /etc/apache2/ports.conf\n\
\n\
# Create virtual host config\n\
cat > /etc/apache2/sites-available/000-default.conf << EOF\n\
<VirtualHost *:${PORT:-80}>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
</VirtualHost>\n\
EOF\n\
\n\
# Start Apache\n\
exec apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

# Expose port
EXPOSE $PORT

# Start Apache with runtime configuration
CMD ["/usr/local/bin/start-apache.sh"]