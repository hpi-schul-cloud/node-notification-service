const config = {
	MONGO_DB_PATH: `mongodb://${process.env.MONGO_HOST || 'localhost'}/notification-service-test`,
};

export default config;
