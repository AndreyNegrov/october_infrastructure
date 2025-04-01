#!/bin/bash

# Установка Docker на Ubuntu - автоматический скрипт
echo "=== Установка Docker на Ubuntu ==="

# Проверка на root-права
if [ "$(id -u)" -ne 0 ]; then
  echo "Ошибка: скрипт должен запускаться с правами root (sudo)" >&2
  exit 1
fi

# Обновление пакетов
echo "Обновление списка пакетов..."
apt-get update -qq

# Установка зависимостей
echo "Установка необходимых зависимостей..."
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg-agent

# Добавление официального GPG-ключа Docker
echo "Добавление GPG-ключа Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Добавление репозитория Docker
echo "Добавление репозитория Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновление пакетов после добавления репозитория
echo "Обновление пакетов..."
apt-get update -qq

# Установка Docker
echo "Установка Docker CE (Community Edition)..."
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверка версии Docker
echo "Проверка установки..."
docker --version

# Добавление текущего пользователя в группу docker (чтобы не использовать sudo)
echo "Добавление текущего пользователя в группу docker..."
usermod -aG docker $SUDO_USER

echo "Установка завершена успешно!"
echo "Для применения изменений групп нужно выйти и зайти в систему или выполнить:"
echo "newgrp docker"
echo "После этого можно проверить работу Docker командой:"
echo "docker run hello-world"