import RequestMessage from '@/interfaces/RequestMessage';

const message: RequestMessage = {
  platform: 'testplatform',
  template: 'global-announcement',
  sender: {
    name: 'Test Sender',
    mail: 'sender@test.test',
  },
  payload: {
    title: 'Test Title',
  },
  languagePayloads: [
    {
      language: 'en',
      payload: {
        description: 'Test Description',
      },
    },
  ],
  receivers: [
    {
      name: 'Test Receiver',
      mail: 'receiver@test.test',
      payload: {
        name: 'Test Receiver',
      },
      language: 'en',
      preferences: {
        push: true,
        mail: true,
      },
    },
  ],
};

export default message;
