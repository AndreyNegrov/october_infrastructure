**Установка**:

Необходим установленный Docker

atp update && apt install git -y

git clone git@github.com:AndreyNegrov/october_infrastructure.git october_infrastructure

cd october_infrastructure

docker network create october-network

docker-compose up -d

docker-compose exec -it php composer create-project october/october myoctober

docker-compose exec -it php rsync -av --exclude='.git' --exclude='README.md' myoctober/* ./

docker-compose --env-file docker/.env -f docker/docker-compose.yml exec -it php sed -i '$a\COMPOSE_FILE=docker/docker-compose.yml' .env

docker-compose exec -it php sed -i 's/DB_HOST=.*/DB_HOST=mysql/' .env
docker-compose exec -it php sed -i 's/DB_DATABASE=.*/DB_DATABASE=october/' .env
docker-compose exec -it php sed -i 's/DB_USERNAME=.*/DB_USERNAME=root/' .env
docker-compose exec -it php sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=b3ede22a26bd6e2ac281fe6d9e2e89de/' .env

docker-compose exec -it php sed -i '$a\APP_URL=http://localhost' .env

docker-compose exec -it php php artisan october:install

docker-compose exec -it php php artisan october:migrate

docker-compose exec -it php chmod -R 777 *
