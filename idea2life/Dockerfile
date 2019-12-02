FROM node:10-alpine
WORKDIR /usr/src/app
COPY package.json ${WORKDIR}
RUN npm install
EXPOSE 1813
CMD ["npm", "start"]
