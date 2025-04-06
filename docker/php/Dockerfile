FROM php:8.3-fpm

RUN sed -i 's|deb.debian.org|ftp.debian.org|g' /etc/apt/sources.list

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        software-properties-common \
    && add-apt-repository universe \
    && apt-get update && \
    apt-get install -y \
        curl \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        zip \
        unzip \
        libcurl4-openssl-dev \
        libssl-dev \
        libzip-dev \
        mc \
        rsync \
        git \
    && rm -rf /var/lib/apt/lists/*

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
