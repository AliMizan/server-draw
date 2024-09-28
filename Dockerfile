FROM node:19.6-alpine

# Specify working directory other than /
WORKDIR /usr/src/app

# Copy only files required to install
# dependencies (better layer caching)
COPY . .

RUN npm install

RUN npm install nodemon



CMD [ "npm","run","dev" ]