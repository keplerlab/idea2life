FROM node:10-alpine
WORKDIR /usr/src/app
COPY . ${WORKDIR}
RUN npm install
EXPOSE 1813
CMD ["npm", "start"]
