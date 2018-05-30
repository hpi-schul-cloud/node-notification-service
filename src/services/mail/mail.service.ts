import express from 'express';
import nodeMailer from 'nodemailer';
import config from '../../config';
import MailService from './MailService';
import Mail from '../../interfaces/Mail';

const router: express.Router = express.Router();
const mailService: MailService = new MailService();

router.post('/mails', (req, res) => {
  const mail: Mail = {
    from: `"${config.mail.from.name} " <${config.mail.from.email}>`,
    to: req.body.to,
    subject: req.body.subject,
    text: req.body.text,
    html: req.body.html
  };

  mailService.send(mail).then((response: any) => {
    console.log(response);
  })

  res.send('Mail queued.');
});

export default router;
