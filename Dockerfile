# 1단계: React 애플리케이션 빌드
FROM node:20 AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 yarn.lock을 먼저 복사하여 의존성 설치
COPY package.json yarn.lock ./

# 의존성 설치
RUN yarn install

# 소스 코드 복사
COPY . .

# React 애플리케이션 빌드
RUN yarn build

# 2단계: Nginx 설정
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/mime.types /etc/nginx/mime.types

# 빌드된 React 애플리케이션을 Nginx 서버로 복사
COPY --from=build /app/build /usr/share/nginx/html

# Nginx가 80 포트에서 수신하도록 설정
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]

