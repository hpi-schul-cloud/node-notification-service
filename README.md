# Push Notification API [![Travis Status](https://travis-ci.org/schulcloud/node-notification-service.svg?branch=master)](https://travis-ci.org/schulcloud/node-notification-service) [![Code Coverage](https://img.shields.io/codecov/c/github/schulcloud/node-notification-service/master.svg)](https://codecov.io/gh/schulcloud/node-notification-service)

> Feathers app to provide a push notification api

## About

This app can be used as central notification service for existing applications.

As API framework, we use [Feathers](http://feathersjs.com). 

## Architecture

<img src="http://i.imgur.com/1YJa3Fw.png" width="800">

## Getting Started

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) and [mongodb](https://www.mongodb.com/) installed.

2. Install your dependencies

    ```
    cd path/to/node-notification-service; npm install
    ```

3. If not already done, start mongodb (`mongod`). Make sure you created the `/data/db` directory and have permissions to write to it.  
   
    You can also specify a local path:
    ```
    mongod --dbpath=data/db
    ```

4. Create private `config.json`

    ```
    cp secure/config.sample.json secure/config.json
    ```

5. Start your app

    ```
    npm start
    ```

## Configuration

In this repository we provide you with a sample configuration file, which can be found [here](https://github.com/schulcloud/node-notification-service/blob/master/secure/config.sample.json). Copy it to `secure/config.json`, as described above.

### Safari Web Notifications

To send Safari Web Notifications you need an Apple developer license. Go to the [Certificates, Identifiers & Profiles](https://developer.apple.com/account/ios/certificate) section of your developer account and register a new Website Push ID. Because we are using the [apn-node](https://github.com/node-apn/node-apn) package, you are free to use the certificate file or the token. Set your configuration according to the [apn.Provider](https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown) documentation in your configuration file under the `sendServices.apn` property. Here you also have to specifiy the `pushId`.

Safari requires specific endpoints to register with your service. One of them has to serve the Push Package. To create it follow these steps:

1. Make sure you have openssl 0.9.8 installed.

2. Copy your p12-certificate to `generate-pushPackage/cert.p12`.

3. Copy your icons as defined in the [documentation](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/NotificationProgrammingGuideForWebsites/PushNotifications/PushNotifications.html#//apple_ref/doc/uid/TP40013225-CH3-SW5) to `generate-pushPackage/icon.iconset`.

4. Setup the `generate-pushPackage/website.json` according to your needs, as defined in the [documentation](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/NotificationProgrammingGuideForWebsites/PushNotifications/PushNotifications.html#//apple_ref/doc/uid/TP40013225-CH3-SW4).

5. Run the script with your certificate's password: 

  ```
  cd path/to/generate-pushPackage
  php createPushPackage.php <password>
  ```

6. You should find the pushPackage.zip in `secure/` from where it will be served.

For more information refer to the official documentations from [Apple](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/NotificationProgrammingGuideForWebsites/PushNotifications/PushNotifications.html) and [apn-node](https://github.com/node-apn/node-apn/blob/master/README.md).

### Firebase Notifications

To setup Firebase Notifications all you need is the server token of your project. This can be found in your Firebase project settings under the tab Cloud Messaging. Copy it to the `config.json` in the `sendServices.firebase.serverToken` property.

For more information refer to the official documentations from [Google](https://firebase.google.com/docs/cloud-messaging/) and [node-gcm](https://github.com/ToothlessGear/node-gcm/README.md).

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
