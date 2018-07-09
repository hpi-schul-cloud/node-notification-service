import UserRessource from '@/interfaces/UserRessource';
import LanguagePayload from '@/interfaces/LanguagePayload';


export default interface RequestMessage {
  platform: string;
  template: string;
  sender?: {
    name: string;
    mail: string;
  };
  payload: {};
  languagePayloads: LanguagePayload[];
  receivers: UserRessource[] | string;
  trackLinks?: boolean;
}
