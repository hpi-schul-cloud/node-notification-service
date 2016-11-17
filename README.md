# Schulcloud Notification-API

> feathers app to provide the schulcloud notification api

## About

This app will be the central notification service of the schulcloud project. 

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

5. Start your app

    ```
    npm start
    ```

## Testing

To run the tests, make sure mocha and chai are installed.
Simply run `npm test` and all your tests in the `test/` directory will be run.
The test script executes jshint and mocha. If you just want to run either of them use: `mocha test/ --recursive` or `jshint src/. test/. --config`  

## Scaffolding

Feathers has a powerful command line interface. Here are a few things it can do:

```
$ npm install -g feathers-cli             # Install Feathers CLI

$ feathers generate service               # Generate a new Service
$ feathers generate hook                  # Generate a new Hook
$ feathers generate model                 # Generate a new Model
$ feathers help                           # Show all commands
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).

## Changelog

__0.1.0__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
