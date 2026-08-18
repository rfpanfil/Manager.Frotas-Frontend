# Estágio 1: Build da aplicação React
FROM node:22-alpine as builder

WORKDIR /app

# Copia dependências e instala
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Recebe a URL da API do docker-compose e injeta no build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Gera a versão otimizada de produção na pasta /dist
RUN npm run build

# Estágio 2: Servidor Web (Nginx) para servir os arquivos estáticos
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no build anterior para o Nginx servir
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]