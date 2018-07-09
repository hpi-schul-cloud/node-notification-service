import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import mailRouter from './routes/mail';
import pushRouter from './routes/push';
import messageRouter from './routes/message';
import deviceRouter from './routes/device';

function startApiServer() {
  const app: express.Application = express();
  const port: string = process.env.PORT || '3000';

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());

  app.use('/mails', mailRouter);
  app.use('/push', pushRouter);
  app.use('/messages', messageRouter);
  app.use('/devices', deviceRouter);

  app.get('/', (req, res) => {
    res.send('hello world!');
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

  // Test Endpoint for user pagination
  app.get('/users', (req, res) => {
    const users = [
      {
        name: 'Bob',
        mail: 'bob@bob.bob',
        language: 'en',
        payload: {
          course: 'Bobs Course',
          week: 6,
        },
      },
      {
        name: 'Alice',
        mail: 'alice@alice.alice',
        language: 'de',
        payload: {
          course: 'Alices Course',
          week: 4,
        },
      },
    ];

    if (!req.query.page) {
      res.json({
        data: users,
      });
      return;
    }

    if (req.query.page >= users.length) {
      res.json({
        data: [],
      });
      return;
    }

    const links = {
      next: `http://localhost:3000/users?page=${ parseInt(req.query.page, 10) + 1 }`,
    };

    res.json({
      data: [users[req.query.page]],
      links: req.query.page + 1 >= users.length ? {} : links,
    });
  });

  app.listen(port);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', startApiServer);

mongoose.connect('mongodb://localhost/notification-service');
