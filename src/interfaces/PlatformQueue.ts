import Queue from 'bee-queue';

export default interface PlatformQueue {
	platformId: string;
	queue: Queue;
}
