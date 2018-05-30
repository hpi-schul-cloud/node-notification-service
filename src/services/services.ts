import express from 'express';
import mail from './mail/mail.service';

const router: express.Router = express.Router()

router.use(mail);

export default router;
