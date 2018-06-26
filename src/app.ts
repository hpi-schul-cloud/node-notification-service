import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import mailRouter from './routes/mail';
import pushRouter from './routes/push';

const app: express.Application = express();
const port: string = process.env.PORT || '3000';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/mails', mailRouter);
app.use('/push', pushRouter);

app.get('/', function (req, res) {
  res.send('hello world!');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('../swagger.json')));

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
