FROM golang:1.18-alpine as build
RUN apk add --no-cache git libc-dev
RUN go install github.com/patrickbr/gtfstidy@25d4d6d1079a5926d9a558546bbe36d5b4cdb45f

FROM node:alpine

WORKDIR /usr/src/app
RUN mkdir cache

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY --from=build /go/bin/gtfstidy /bin
COPY . .
RUN npm run build:js

ENV NODE_ENV=production

ENTRYPOINT [ "node","lib/index.js" ]
