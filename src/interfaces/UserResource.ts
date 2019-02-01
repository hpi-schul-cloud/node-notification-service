export default interface UserResource {
  _id : any;
  name: string;
  mail: string;
  payload: any;
  language: string;
  preferences: {
    [key: string]: boolean,
  };
}
