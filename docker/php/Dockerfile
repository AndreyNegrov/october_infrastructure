FROM php:8.3-fpm

RUN apt-get update
RUN apt-get install git -y
RUN apt-get install curl -y
RUN apt-get install libpng-dev -y
RUN apt-get install libonig-dev -y
RUN apt-get install libxml2-dev -y
RUN apt-get install zip -y
RUN apt-get install unzip -y
RUN apt-get install libcurl4-openssl-dev -y
RUN apt-get install libssl-dev -y
RUN apt-get install libzip-dev -y
RUN apt-get install mc -y
RUN apt-get install rsync -y

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
