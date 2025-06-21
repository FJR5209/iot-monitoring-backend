# Passo 1: Escolha a imagem base do Node.js
FROM node:18-slim

# Instala as dependências de sistema necessárias para o 'canvas'
# O '--no-install-recommends' evita instalar pacotes desnecessários
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os ficheiros de dependências
COPY package*.json ./

# Instala as dependências do projeto (agora no ambiente Linux com as libs corretas)
RUN npm install --production

# Copia o resto do código da aplicação
COPY . .

# Expõe a porta que a sua aplicação usa (ajuste se for diferente)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"] 