# notification-service


[![Build Status](https://travis-ci.org/schul-cloud/node-notification-service.svg?branch=master)](https://travis-ci.org/schul-cloud/node-notification-service)
![Node.js CI](https://github.com/schul-cloud/node-notification-service/workflows/Node.js%20CI/badge.svg)
![Node.js CI](https://github.com/schul-cloud/node-notification-service/workflows/Node.js%20CI/badge.svg?branch=develop)


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

## Architecture

![Architecture Diagram](https://user-images.githubusercontent.com/12249969/43454900-9ee6c4e6-94be-11e8-97b1-ed1371d3dece.png)

To construct our notifications service, we structured our project in several different components from top to bottom. Aside from the high-level message service, a templating service, an escalation service, a device service and low level sending services are needed. For a more detailed insight, how these services collaborate, let us go through a small exemplary workflow:

At the beginning, an API user sends a message to our notification service. Internally the message service gets activated first. This service retrieves external user resources in case that the `receivers` attribute of the sent message is an URL. It expects an API endpoint that fulfils the JSON API specification for [pagination](http://jsonapi.org/format/#fetching-pagination). Finally, the message object gets enriched with the provided receivers. In the end, we store this message in our message DB.

The message service calls our escalation logic in the next step. The escalation logic plans the escalation on the given notification preferences of the user resources. Depending on the actual notification preferences, push and/or mail messages will be sent. Before sending the final messages, we first need to construct them with the templating service. This service creates different templates for the different channels (push and mail) and the different languages (defined in the `languagePayloads` attribute of the message). It then uses the appropriate templates to construct the final messages by inserting the payload for each single user.

At the end, the escalation logic sends the final messages according to some specific escalation settings (defined in the `config.json`) to the low level sending services. It sends the final push messages to the push service and the final mail messages to the mail service. Both services are then responsible for the eventual delivery of the messages.

We also have the device service: this service is only responsible for managing the device tokens. The device tokens are necessary to deliver the push notifications to the different devices.

External services can mark specific messages as seen to disable the escalation logic for a specific user. If the push message was delivered and this message was marked as seen via the respective API call, the mail message will not be sent.

## Config
To use multiple Mail Configs (for example for load balancing) just use an array of options in the mail config.

```
{
  "mail": {
    "options": [
      {
        "host": "mail",
        "port": 1025,
        "secure": false,
        "auth": {
          "user": "",
          "pass": ""
        }
      },
      ...
    ],
    "defaults": {
      "from": "Sample Service <sample@sample.org>",
      "delay": 0
    }
  }
```

## Docs

A Swagger Docs is available at ```/docs```

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
