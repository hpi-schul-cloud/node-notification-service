import UserRessource from '@/interfaces/UserRessource';
import TemplatePayload from '@/interfaces/TemplatePayload';


export default interface Message {
  platform: string;
  template: string;
  sender?: {
    name: string;
    mail: string;
  };
  payload: TemplatePayload[];
  receivers: UserRessource[];
  trackLinks?: boolean;
}
