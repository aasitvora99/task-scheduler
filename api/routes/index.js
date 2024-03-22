const controller = require('../controller'),
    config = require('../../config');

module.exports = (app) => {
    app.get(`${config.rootPath}healthcheck`, controller.healthcheck);

    app.post(`${config.rootPath}application`, controller.postApplication);
    app.get(`${config.rootPath}application`, controller.getApplication);
    app.put(`${config.rootPath}application`, controller.putApplication);
    app.delete(`${config.rootPath}application`, controller.deleteApplication);

    app.get(`${config.rootPath}api`, controller.getApi);
    app.post(`${config.rootPath}api`, controller.postApi);
    app.put(`${config.rootPath}api`, controller.putApi);
    app.delete(`${config.rootPath}api`, controller.deleteApi);
};
