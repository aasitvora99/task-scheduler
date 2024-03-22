module.exports = {
    port: 8000,
    rootPath: '/api/task-scheduler/',
    sApplicationName: 'api-task-scheduler',
    securityKey: process.env.NODE_APP_SECURITY_KEY,
    securityIV: process.env.NODE_APP_SECURITY_IV,
    mongoURL: process.env.NODE_APP_MONGO_URL,
    mongodbName: process.env.NODE_APP_MONGO_DBNAME,
    mongoUserName: process.env.NODE_APP_MONGO_USERNAME,
    mongoPassword: process.env.NODE_APP_MONGO_PASSWORD,
    hostURL: process.env.NODE_APP_HOST_URL,

    get dbPath() {
        return this.mongoURL
            .replace('@username', this.mongoUserName)
            .replace('@password', this.mongoPassword)
            .replace('@dbname', this.mongodbName);
    }
};
