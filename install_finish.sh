#!/bin/sh

if [ -z "$DOMAIN" ]; then
    echo "Ошибка: домен не может быть пустым!"
    exit 1
fi

cd october_infrastructure

sed "s/{{DOMAIN}}/$DOMAIN/g" docker/nginx/templates/app.conf.template2 > docker/nginx/config/default.conf

docker-compose down
docker-compose up -d

chmod -R 777 *

#ssh root@english-in-easy.com "DOMAIN=english-in-easy.com bash -s" < install.sh
#ssh root@english-in-easy.com "DOMAIN=english-in-easy.com bash -s" < install_finish.sh
#ssh root@english-in-easy.com
#cd october_infrastructure
#mysql -h 127.0.0.1 -u root -pb3ede22a26bd6e2ac281fe6d9e2e89de october < dump.sql
