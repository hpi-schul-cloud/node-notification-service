export default interface FailedJob {
	receiver: string,
	jobId: number,
	data: object,
	error: object,
}
