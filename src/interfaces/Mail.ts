export default interface Mail {
	from?: string;
	to: string;
	subject: string;
	text: string;
	html: string;
	attachments?: Array<{content: Buffer|string, filename: string}>;
}
