FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de sistema necesarias
RUN apk add --no-cache bash

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]