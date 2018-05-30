import Mail from '../../interfaces/Mail';
import express from 'express';
import nodeMailer from 'nodemailer';
import config from '../../config';


export default class MailService {

  public send(mail: Mail): Promise<any> {
    return this._transporter.sendMail(mail);
  }

  constructor() {
    this._transporter = nodeMailer.createTransport(config.mail.smtp);
  }

  private readonly _transporter: nodeMailer.Transporter;
}
