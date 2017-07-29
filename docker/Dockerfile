FROM node

MAINTAINER Geoff Cox redgeoff@gmail.com

WORKDIR /usr/src/app

RUN npm install -g replicate-couchdb-cluster

COPY docker-entrypoint.sh .
COPY replicate.sh .

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["/usr/local/bin/replicate-couchdb-cluster"]
