## СИСТЕМА КОНТРОЛЯ ЗАДАЧ 

## 🛠 Технологический стек

### Frontend
- **React** + **TypeScript** ⚛️  

### Backend  
- **Node.js** (NestJS) 🏗️  
- **PostgreSQL** 🐘 + **Redis** 🧠 + **S3** (Cloud.ru) ☁️  

### Безопасность  
- **JWT** аутентификация 🔒  

### Мониторинг  
- **Prometheus** + **Grafana** 📊  

## 📦 Версии  
- **Node.js**: 20.18.0 (для фронтенда и бекенда)  

## 🏁 Запуск проекта  

1. Перейти в нужную папку (`frontend` или `backend`).  
2. Установить зависимости:  
   ```bash
   npm install
   ```
3. Запустить проект:  
   ```bash
   npm start
   ```

## 🐳 Docker  

## 🚀 DevOps  

### CI (Continuous Integration)  
- **Линтер** (ESLint) ✔️  
- В будущем: **Prettier** + **тесты** 🧪  

### CD (Continuous Deployment)  
1. Сборка **Docker-образов** 🏗️  
2. Загрузка на **Docker Hub** 📦  
3. **Деплой** на виртуалку через скрипт:  
   ```bash
   deploy <тег-версии>
   ```

## ☁️ Виртуалка (Cloud.ru)  

- **ОС**: Ubuntu 22.04 🐧  
- **Домен**: `goal-path` (настроен в **Nginx**) 🌐  
- **HTTPS** включен 🔐  

## 📦 S3 (Cloud.ru)  

- Бакет развернут в облаке **Cloud.ru** ☁️  
