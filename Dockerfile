FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip pdo pdo_mysql mysqli

# Enable Apache mod_rewrite and configure MPM
RUN a2enmod rewrite && \
    a2dismod mpm_event mpm_worker mpm_prefork && \
    a2enmod mpm_prefork

# Set working directory
WORKDIR /var/www/html

# Copy PHP files
COPY api/ /var/www/html/api/
COPY public/ /var/www/html/public/

# Create uploads directory
RUN mkdir -p /var/www/html/uploads && chmod 777 /var/www/html/uploads

# Copy Apache config
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]