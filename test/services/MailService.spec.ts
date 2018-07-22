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
    expect(messageInfo.accepted.length)
      .to.equal([ mail.to ].length)
      .to.equal(1);

    expect(messageInfo.accepted[0])
      .to.equal(mail.to.toString());
  });

  it('should send an e-mail, which is not rejected.', async () => {
    expect(messageInfo.rejected.length)
      .to.equal(0);
  });

  it('should send an e-mail, from the given sender.', async () => {
    expect(messageInfo.envelope.from)
      .to.equal(mail.from);
  });

});
