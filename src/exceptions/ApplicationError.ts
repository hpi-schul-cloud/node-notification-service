export default class ApplicationError extends Error {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(public status: number, public message: string, public details: Record<string, any>) {
		super(message);
	}
}
