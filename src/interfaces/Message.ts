import UserResource from '@/interfaces/UserResource';
import LanguagePayload from '@/interfaces/LanguagePayload';


export default interface Message {
  platform: string;
  template: string;
  sender?: {
    name: string;
    mail: string;
  };
  payload: {};
  languagePayloads: LanguagePayload[];
  receivers: UserResource[];
  trackLinks?: boolean;
}
