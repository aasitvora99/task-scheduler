const config = require('../../config');
const utils = require('./utils');

exports.postSuccessLog = async (obj) => {
    let successObj = {
        userId: obj.userId || '',
        appId: '004',
        appName: config.sApplicationName,
        subAppName: '',
        ipAddress: '',
        deviceType: 'OS',
        dbSource: 'mongodb',
        uuid: obj.documentId || '',
        collectionName: obj.collectionName || '',
        url: obj.url || '',
        message: obj.message || 'Something went wrong',
        responseCode: 200,
        type: 'success',
        methodType: '',
        payload: obj.payload || '',
        date: new Date()
    };
    await utils.successLog(successObj);
};

exports.postErrorLog = async (obj) => {
    let errorObj = {
        userId: obj.userId || '',
        appId: '004',
        appName: config.sApplicationName,
        subAppName: '',
        ipAddress: '',
        deviceType: 'OS',
        dbSource: 'mongodb',
        uuid: obj.documentId || '',
        collectionName: obj.collectionName || '',
        url: obj.url || '',
        message: obj.message || 'Something went wrong',
        responseCode: 400,
        type: 'Error',
        methodType: '',
        payload: obj.payload || '',
        date: new Date()
    };
    await utils.errorLog(errorObj);
};
