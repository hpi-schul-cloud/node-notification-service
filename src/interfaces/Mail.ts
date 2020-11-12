export type Attachment = { content: Buffer | string; filename: string };

export default interface Mail {
	from?: string;
	replyTo?: string;
	to: string;
	subject: string;
	text: string;
	html: string;
	attachments?: Attachment[];
	envelope?: {
		from?: string;
		to?: string;
	};
}
