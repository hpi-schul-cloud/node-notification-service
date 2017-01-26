# Push Notification API [![Travis Status](https://travis-ci.org/schulcloud/node-notification-service.svg?branch=master)](https://travis-ci.org/schulcloud/node-notification-service) [![Code Coverage](https://img.shields.io/codecov/c/github/schulcloud/node-notification-service/master.svg)](https://codecov.io/gh/schulcloud/node-notification-service)

> Feathers app to provide a push notification api

## About

This app can be used as central notification service for existing applications.

As API framework, we use [Feathers](http://feathersjs.com). 

## Architecture

<img src="http://i.imgur.com/1YJa3Fw.png" width="800">

## Getting Started

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) and [mongodb](https://www.mongodb.com/) installed.

2. Install nodemon

    ```
    npm install nodemon -g
    ```

3. Install your dependencies

    ```
    cd path/to/node-notification-service; npm install
    ```

4. If not already done, start mongodb (`mongod`). Make sure you created the `/data/db` directory and have permissions to write to it.  
   
    You can also specify a local path:
    ```
    mongod --dbpath=data/db
    ```

5. Create private `config.json`

    ```
    cp src/services/sendInterface/adapters/config.sample.json src/services/sendInterface/adapters/config.json
    ```

6. Start your app

    ```
    npm start
    ```

## Testing

To run the tests, simply run `npm test` and all your tests in the `test/` directory will be run.
The test script executes the unit tests using mocha and lints the code using eslint.

In addition the following commands are available:
```shell
npm run testing # execute the tests whenever a file is changed
npm run coverage # execute the tests once
npm run eslint # lint the code use eslint
npm run jshint # lint the code using jshint
```

## Changelog

__0.1.0__

- pending...

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
