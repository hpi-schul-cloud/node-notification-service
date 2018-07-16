# notification-service

## Deployment

1. Download the <a href="https://github.com/schul-cloud/node-notification-service/blob/master-v4/docker-compose.yml" download>docker-compose.yml</a>.

1. Download the [platform templates](https://github.com/schul-cloud/node-notification-service/tree/master-v4/platforms) and configure your platforms or create your own platform config.

1. Change the mounted directory inside the docker-compose.yml matching your path.

1. Deploy the service using docker compose / stack: 
  ```docker-compose up``` or ```docker stack -c docker-compose.yml```.

## Getting Started

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install the dependencies

    ```
    npm install
    ```

3. Start the app

    ```
    npm start
    ```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
