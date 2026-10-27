# ── 1) PHP dependencies ──────────────────────────────────────────────
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --ignore-platform-reqs --no-interaction
COPY . .
RUN composer dump-autoload --optimize --no-dev --no-scripts

# ── 2) Runtime: PHP 8.3 FPM + Nginx (listens on 8080) ────────────────
FROM serversideup/php:8.3-fpm-nginx
USER root
RUN install-php-extensions intl bcmath
ENV PHP_OPCACHE_ENABLE=1 \
    PHP_UPLOAD_MAX_FILE_SIZE=20M \
    PHP_POST_MAX_SIZE=25M \
    AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true
COPY --chown=www-data:www-data --from=vendor /app /var/www/html
USER www-data
