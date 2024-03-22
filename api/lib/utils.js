const config = require('../../config');
const axios = require('axios');
const crypto = require('crypto');

exports.dateToIST = (date) => {
    return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
};
const convertToUTC = (istTime) => {
    const istDate = new Date(istTime);
    const utcTimestamp =
        istDate.getTime() - istDate.getTimezoneOffset() * 60000;
    return new Date(utcTimestamp);
};
exports.calculateCronExpression = (frequency, triggerTime) => {
    let cronExpression = '';
    const time = convertToUTC(triggerTime);
    switch (frequency) {
        case 'Hourly':
            //TODO: fix minute wise execution
            cronExpression = `* * * * *`;
            break;

        case 'Daily':
            cronExpression = `${time.getMinutes()} ${time.getHours()} * * *`;
            break;

        case 'Weekly':
            cronExpression = `${time.getMinutes()} ${time.getHours()} * * ${time.getDay()}`; // Day of week (0-6, Sunday = 0)
            break;

        case 'Monthly':
            cronExpression = `${time.getMinutes()} ${time.getHours()} ${time.getDate()} * *`;
            break;

        case 'Quarterly':
            //TODO: make adjustments for financial quarter logic
            cronExpression = `${time.getMinutes()} ${time.getHours()} ${time.getDate()} */3 *`; // Every 3 months
            break;

        case 'Yearly':
            cronExpression = `${time.getMinutes()} ${time.getHours()} ${time.getDate()} ${time.getMonth() + 1} *`;
            break;

        case 'Instant':
            cronExpression = '';
            break;

        default:
            throw new Error('Invalid frequency');
    }

    return cronExpression;
};

exports.successLog = async (data) => {
    try {
        // console.log(`\nSuccess Log Payload: ${JSON.stringify(data)}`);
        await axios.post(config.sSuccessURL, data);
        // console.log(`Success logged: ${JSON.stringify(response.data)}`);
    } catch (error) {
        let msg = error.message;
        if (error.response && error.response.data) {
            msg = JSON.stringify(error.response.data);
        }
        console.error(`Error while logging success: ${msg}`);
    }
};

exports.errorLog = async (data) => {
    try {
        //console.log(`\nError Log Payload: ${JSON.stringify(data)}`);
        await axios.post(config.sErrorURL, data);
        //console.log(`Error logged: ${JSON.stringify(response.data)}`);
    } catch (error) {
        let msg = error.message;
        if (error.response && error.response.data) {
            msg = JSON.stringify(error.response.data);
        }
        console.error(`Error while logging error: ${msg}`);
    }
};

function convertTo32Bytes(key) {
    const hash = crypto
        .createHash('sha256')
        .update(key)
        .digest('base64')
        .substr(0, 32);
    return hash;
}

exports.checkKeyAuth = (req, res, next) => {
    const currentDateTime = new Date().toISOString();
    const algorithm = 'aes-256-cbc';
    const originalKey = config.securityKey;
    const key = convertTo32Bytes(originalKey);
    const iv = config.securityIV;
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encryptedDateTime = cipher.update(currentDateTime, 'utf-8', 'hex');
    encryptedDateTime += cipher.final('hex');

    req.headers['x-api-key'] = encryptedDateTime;

    if (req.headers['x-api-key'] === encryptedDateTime) {
        // eslint-disable-next-line no-console
        console.log('API key is valid');
        next();
    } else {
        res.status(401).send({
            error: 'Invalid API key'
        });
    }
};
