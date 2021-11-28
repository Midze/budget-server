A GraphQL API built on top of NestJS and containerized by Docker.

The application was built for the [Build a Scalable GraphQL Server With NestJS, MongoDB & TypeScript](https://tomanagle.medium.com/build-a-scalable-graphql-server-with-nestjs-mongodb-typescript-1eeda049f7c8) tutorial.

### Getting started
Start the application

`yarn dev`

Build and start the container

`docker-compose up`

### Automatic redeployment on the server

For redeploying the docker image we are using [watchtower](https://containrrr.dev/watchtower/).

To activate automatic redeployment, simply execute the following command on the server:

```
docker run -d \
--name watchtower \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/localtime:/etc/localtime:ro \
containrrr/watchtower \
--cleanup \
--remove-volumes \
--interval 60
```