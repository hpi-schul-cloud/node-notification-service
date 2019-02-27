import UserResource from '@/interfaces/UserResource';
import LanguagePayload from '@/interfaces/LanguagePayload';
import Callback from '@/interfaces/Callback';
import { Types } from 'mongoose';

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
	seenCallback: Callback[];
}
