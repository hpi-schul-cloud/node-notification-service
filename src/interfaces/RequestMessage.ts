import UserResource from '@/interfaces/UserResource';
import LanguagePayload from '@/interfaces/LanguagePayload';
import Callback from '@/interfaces/Callback';


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
  seenCallback: Callback[];
}
