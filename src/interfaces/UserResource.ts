export default interface UserResource {
  name: string;
  mail: string;
  payload: any;
  language: string;
  disabledPushMessages?: boolean;
}
