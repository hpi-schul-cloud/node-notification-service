export default interface Mail {
	from?: string;
	replyTo?: string;
	to: string;
	subject: string;
	text: string;
	html: string;
	attachments?: Array<{ content: Buffer | string, filename: string }>;
	envelope?: {
		from?: string;
		to?: string;
	};
}
