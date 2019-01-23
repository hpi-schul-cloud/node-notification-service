import UserResource from '@/interfaces/UserResource';
import LanguagePayload from '@/interfaces/LanguagePayload';


export default interface RequestMessage {
  platform: string;
  template: string;
  sender?: {
    name: string;
    mail: string;
  };
  payload: any;
  languagePayloads: LanguagePayload[];
  receivers: UserResource[] | string;
  trackLinks?: boolean;
  seen: string[];
}
