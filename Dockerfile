# Usar Node oficial
FROM node:22

# Crear carpeta de la app
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Iniciar el bot
CMD ["node", "index.js"]