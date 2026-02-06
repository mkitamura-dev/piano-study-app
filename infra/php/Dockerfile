FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    bash git unzip icu-dev oniguruma-dev \
    libzip-dev zlib-dev \
    mysql-client \
  && docker-php-ext-install pdo_mysql mbstring intl zip opcache

# composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
