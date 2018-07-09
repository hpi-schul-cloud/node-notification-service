import UserRessource from '@/interfaces/UserRessource';
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
  receivers: UserRessource[];
  trackLinks?: boolean;
}
