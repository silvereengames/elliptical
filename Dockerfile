FROM node:lts
# Create app directory
WORKDIR /usr/src/app

COPY ./ ./

RUN npm install

CMD [ "node", "./index.js", "Docker" ]