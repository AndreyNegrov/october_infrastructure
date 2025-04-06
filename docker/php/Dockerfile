FROM php:8.2-fpm

# Удаляем ВСЕ существующие конфиги репозиториев
RUN rm -rf /etc/apt/sources.list /etc/apt/sources.list.d/*

# Создаём новый sources.list только с нужными зеркалами
RUN echo "deb http://mirror.yandex.ru/debian bookworm main" > /etc/apt/sources.list && \
    echo "deb http://mirror.yandex.ru/debian-security bookworm-security main" >> /etc/apt/sources.list

RUN apt-get update

RUN apt-get install -y --no-install-recommends software-properties-common
RUN apt-get install -y curl
RUN apt-get install -y libpng-dev
RUN apt-get install -y libonig-dev
RUN apt-get install -y libxml2-dev
RUN apt-get install -y zip
RUN apt-get install -y unzip
RUN apt-get install -y libcurl4-openssl-dev
RUN apt-get install -y libssl-dev
RUN apt-get install -y libzip-dev
RUN apt-get install -y mc
RUN apt-get install -y rsync
RUN apt-get install -y git

# 16. Очистка кеша для уменьшения размера образа
RUN rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo_mysql
RUN docker-php-ext-install mbstring
RUN docker-php-ext-install exif
RUN docker-php-ext-install pcntl
RUN docker-php-ext-install bcmath
RUN docker-php-ext-install gd
RUN docker-php-ext-install curl
RUN docker-php-ext-install zip
RUN docker-php-ext-install simplexml
RUN docker-php-ext-enable pdo_mysql
RUN docker-php-ext-enable gd
RUN docker-php-ext-enable zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

CMD php-fpm
