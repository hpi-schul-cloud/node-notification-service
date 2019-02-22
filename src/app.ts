import mongoose from 'mongoose';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
const json = require('morgan-json');
import logger, { LoggerStream } from '@/config/logger';

import mailRouter from '@/routes/mail';
import pushRouter from '@/routes/push';
import messageRouter from '@/routes/message';
import deviceRouter from '@/routes/device';
import HttpException from './exceptions/httpException';

const app: express.Application = express();

const port: string = process.env.NOTIFICATION_PORT || '3000';

const format = json(':status :method :url :res[content-length] bytes :response-time ms');
app.use(morgan(format, { stream: new LoggerStream() }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/mails', mailRouter);
app.use('/push', pushRouter);
app.use('/messages', messageRouter);
app.use('/devices', deviceRouter);

app.get('/', (req, res) => {
  res.send('hello world!');
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

// Test Endpoint for user pagination
app.get('/users', (req, res) => {
  const users = [
    {
      name: 'Bob',
      mail: 'bob@bob.bob',
      payload: {
        course: 'Bobs Course',
        week: 6,
      },
      language: 'en',
      preferences: {
        push: true,
        mail: true,
      },
    },
    {
      name: 'Alice',
      mail: 'alice@alice.alice',
      payload: {
        course: 'Alices Course',
        week: 4,
      },
      language: 'de',
      preferences: {
        push: true,
        mail: true,
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
    next: `http://localhost:3000/users?page=${parseInt(req.query.page, 10) + 1}`,
  };
  res.json({
    data: [users[req.query.page]],
    links: req.query.page + 1 >= users.length ? {} : links,
  });
});

app.use(function (err: HttpException, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message || 'unknown error';
  res.locals.error = req.app.get('NODE_ENV') !== 'production' ? err : {};
  const status = err.status || 500;

  // render the error page
  res.status(status);
  res.render('error');
});

app.listen(port);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

mongoose.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service`);

export default app;
