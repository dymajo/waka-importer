FROM golang:1.16-alpine as build
RUN apk add --no-cache git libc-dev
ENV GOPATH /go
ENV GOBIN=$GOPATH/bin
RUN go mod init waka
RUN go get -v github.com/patrickbr/gtfstidy

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
