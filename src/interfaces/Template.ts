export enum MessageTypes {
  Mail = 'MAIL',
  Push = 'PUSH',
}

export default interface Template {
  languageId: string;
  type: MessageTypes;
  template: any;
}
