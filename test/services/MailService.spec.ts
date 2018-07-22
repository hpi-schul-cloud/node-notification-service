import 'mocha';
import { expect } from 'chai';
import nodeMailer from 'nodemailer';
import MailService from '@/services/MailService';
import Mail from '@/interfaces/Mail';

// Define constants
const platformId: string = 'testplatform';
const mail: Mail = {
  from: 'sender@test.test',
  to: 'receiver@test.test',
  subject: 'Test Subject',
  text: 'Test Plaintext',
  html: '<html>Test HTML</html>',
};

describe('MailService.send function', () => {

  // Instantiate the service
  const mailService = new MailService();
  let messageInfo: any;

  before('should send an e-mail.', async () => {
    // Create ethereal mail account
    const account = await nodeMailer.createTestAccount();
    const transporter = nodeMailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
          user: account.user,
          pass: account.pass,
      },
    });

    // Add the custom transporter
    (mailService as any).transporters.push({
      platformId,
      transporter,
    });

    // Send a mail
    messageInfo = await mailService.send(platformId, mail);
  });

  it('should send an e-mail, accepted by the receiver.', async () => {
    expect(messageInfo.accepted)
      .to.be.an('array')
      .to.have.lengthOf(1)
      .to.include(mail.to);
  });

  it('should send an e-mail, which is not rejected.', async () => {
    expect(messageInfo.rejected)
      .to.be.an('array')
      .that.is.empty
      .to.not.include(mail.to);
  });

  it('should send an e-mail, from the given sender.', async () => {
    expect(messageInfo.envelope)
      .to.have.property('from', mail.from);
  });

});
