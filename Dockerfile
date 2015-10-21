FROM node:4.1.2
COPY . /app
WORKDIR /app
RUN \
	rm -rf node_modules; \
	npm install
EXPOSE 8000
CMD npm start