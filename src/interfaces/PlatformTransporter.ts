export default interface PlatformTransporter {
	platformId: string;
	transporter: any;

	// status
	lastSuccessAt?: Date;
	lastErrorAt?: Date;
	lastError?: any;
	unavailableSince?: Date;
}
