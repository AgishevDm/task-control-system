FROM onlyoffice/documentserver:latest

USER root

# Устанавливаем корневые SSL-сертификаты для Debian/Ubuntu и curl для тестов
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Позволим Node.js игнорировать ошибки самоподписанных сертификатов (отладка)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
