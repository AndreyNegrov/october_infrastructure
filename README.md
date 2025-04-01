**Установка**:

Необходим установленный Docker

atp update && apt install git -y

git clone git@github.com:AndreyNegrov/october_infrastructure.git october_infrastructure

cd october_infrastructure

docker network create october-network

docker-compose --env-file docker/.env -f docker/docker-compose.yml up -d

docker-compose --env-file docker/.env -f docker/docker-compose.yml exec -it php composer create-project october/october myoctober

docker-compose --env-file docker/.env -f docker/docker-compose.yml exec -it php rsync -av --exclude='.git' --exclude='README.md' myoctober/ .

