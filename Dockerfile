FROM node:12.14.0-alpine

WORKDIR /usr/src

RUN apk add bash

COPY ["package.json", "package-lock.json", "/usr/src/"]

RUN npm i

COPY [".*", "*.json", "/usr/src/"]
COPY ["bin/", "/usr/src/bin/"]
COPY ["ispec/", "/usr/src/ispec/"]
COPY ["example/", "/usr/src/example/"]
COPY ["src/", "/usr/src/src/"]
COPY ["features/", "/usr/src/features/"]

RUN npm run test && npm pack

CMD echo "Rebuild me!"
