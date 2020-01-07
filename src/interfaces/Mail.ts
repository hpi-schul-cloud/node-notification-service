export default interface Mail {
	from?: string;
	to: string;
	subject: string;
	text: string;
	html: string;
	attachments?: {content: Buffer|string, filename: string}[];
}
