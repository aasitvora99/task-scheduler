const model = require('../models');
const config = require('../../config');
const utils = require('../lib/utils');

const cronJob = require('cron').CronJob;
const axios = require('axios');
// const mongoose = require('mongoose');
let activeCronJobs = new Set();

const axiosWithMiddleware = axios.create();

axiosWithMiddleware.interceptors.request.use((config) => {
    utils.checkKeyAuth(config, null, () => {});
    return config;
});

const generateAxiosCall = async (payload, url) => {
    switch (payload.requestType) {
        case 'GET':
            await axiosWithMiddleware.get(url).then((response) => {
                // eslint-disable-next-line no-console
                console.log(response.data);
            });
            break;
        case 'POST': //TODO: add payload, query and header params from jobData
            await axios.post(url);
            break;
        case 'PUT': //TODO: add payload, query and header params from jobData
            await axios.put(url);
            break;
        case 'DELETE': //TODO: add payload, query and header params from jobData
            await axios.delete(url);
            break;
        case 'PATCH': //TODO: add payload, query and header params from jobData
            await axios.patch(url);
            break;
        default:
            console.error(
                `Cron job ${payload.apiRoute} failed. request type: ${payload.requestType} not supported`
            );
    }
};

exports.scheduleCronJob = async (payload) => {
    // const jobData = await model.apiModel.findById(payload._id);
    if (payload.isActive === true) {
        const cronExpression = utils.calculateCronExpression(
            payload.frequency,
            payload.triggerTime
        );
        // let cronUrl = `https://api.coindesk.com/v1/bpi/currentprice.json`;
        let cronUrl = `${config.hostURL}${payload.rootPath}${payload.apiRoute}`;

        //Manual trigger
        if (payload.frequency === 'Instant') {
            await generateAxiosCall(payload, cronUrl);
            payload.frequency = '';
            payload.isActive = false;
            payload.history.unshift({
                time: utils.dateToIST(new Date()),
                triggerType: 'Manual'
            });
            await model.apiModel.findOneAndUpdate(
                { _id: payload._id },
                payload
            );
            return payload;
        }
        for (const entry of activeCronJobs) {
            if (entry.id === payload._id) {
                const desiredCronObject = entry.cronObject;
                desiredCronObject.stop();
                activeCronJobs.delete(entry);
                break;
            }
        }
        const job = new cronJob(cronExpression, async () => {
            try {
                // eslint-disable-next-line no-console
                console.log('Executing cron job:', payload.apiRoute);
                await generateAxiosCall(payload, cronUrl);
                payload.cronExpression = cronExpression;
                payload.history.unshift({
                    time: utils.dateToIST(new Date()),
                    triggerType: 'Automatic'
                });
                const nextExecution = job.nextDates(1)[0];
                payload.triggerTime = utils.dateToIST(
                    new Date(nextExecution.toJSDate())
                );
                await model.apiModel.findOneAndUpdate(
                    { _id: payload._id },
                    payload
                );
                // .session(session);
                // await session.commitTransaction();
                // session.endSession();
            } catch (error) {
                // await session.abortTransaction();
                console.error('Cron job error:', error);
            }
        });
        job.start();
        activeCronJobs.add({
            id: payload._id,
            cronObject: job
        });
        return payload;
    } else if (payload.isActive === false) {
        for (const entry of activeCronJobs) {
            if (entry.id === payload._id || entry.id.equals(payload._id)) {
                const desiredCronObject = entry.cronObject;
                desiredCronObject.stop();
                activeCronJobs.delete(entry);
                break;
            }
        }
        await model.apiModel.findOneAndUpdate({ _id: payload._id }, payload, {
            upsert: true
        });
        return payload;
    }
};

exports.healthcheck = (req, res, next) => {
    try {
        res.status(200).json({
            error: false,
            message: 'API is working'
        });
    } catch (error) {
        next(error);
    }
};

exports.postApplication = async (req, res, next) => {
    let payload = req.body;
    try {
        if (payload) {
            if (payload.rootPath) {
                payload.rootPath = !payload.rootPath.startsWith('/')
                    ? '/' + payload.rootPath
                    : payload.rootPath;
                payload.rootPath = !payload.rootPath.endsWith('/')
                    ? payload.rootPath + '/'
                    : payload.rootPath;
            }
            const newApplication = new model.applicationModel(payload);
            await newApplication.save();
            res.status(201).json({
                success: true,
                message: 'Application Created'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payload not found'
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getApplication = async (req, res, next) => {
    const id = req.query.id;
    try {
        if (id) {
            const fetchApplication = await model.applicationModel.findById(id);
            if (fetchApplication) {
                res.status(200).json(fetchApplication);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        } else {
            const fetchAllApplication = await model.applicationModel.find(
                {},
                { _id: 1, appName: 1 }
            );
            if (fetchAllApplication) {
                res.status(200).json(fetchAllApplication);
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Application collection empty'
                });
            }
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.putApplication = async (req, res, next) => {
    let payload = req.body;
    if (Object.keys(payload).length === 0) {
        res.status(400).json({
            success: false,
            message: 'Payload not found'
        });
    }
    try {
        await model.applicationModel.findOneAndUpdate(
            { _id: payload._id },
            payload
        );
        res.status(200).json({
            success: true,
            message: 'Application updated'
        });
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteApplication = async (req, res, next) => {
    const id = req.query.id;
    try {
        if (id) {
            const appDelete = await model.applicationModel.findOneAndDelete({
                _id: id
            });
            if (appDelete) {
                res.status(200).json({
                    success: true,
                    message: 'Document deleted'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'id not found'
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.postApi = async (req, res, next) => {
    if (
        process.env.NODE_APP_MONGODB_ENV !== 'SIT' &&
        process.env.NODE_APP_MONGODB_ENV !== 'DEV'
    ) {
        return res.status(403).json({
            success: false,
            message:
                'Forbidden: Cron creation and modification only in DEV & SIT'
        });
    }
    let payload = req.body;
    try {
        if (payload) {
            const applicationDoc = await model.applicationModel.findById(
                payload.appId
            );
            payload.appName = applicationDoc.appName;
            payload.description = applicationDoc.description;
            payload.rootPath = applicationDoc.rootPath;
            if (new Date(payload.triggerTime) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Time cannot be less than current time'
                });
            }

            const newAPIDoc = new model.apiModel(payload);
            await newAPIDoc.save();
            await model.applicationModel.findOneAndUpdate(
                { _id: payload.appId },
                { $addToSet: { apiList: newAPIDoc._id } },
                { upsert: true }
            );
            res.status(201).json({
                success: true,
                message: 'API Created'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payload not found'
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.putApi = async (req, res, next) => {
    let payload = req.body;
    if (Object.keys(payload).length === 0) {
        res.status(400).json({
            success: false,
            message: 'Payload not found'
        });
    }
    try {
        // await model.apiModel.findOneAndUpdate({ _id: payload._id }, payload);
        const jobData = await this.scheduleCronJob(payload);
        await model.apiModel.findOneAndUpdate({ _id: jobData._id }, jobData);
        if (jobData.isActive === true) {
            res.status(200).json({
                success: true,
                message: 'Cron Scheduled'
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Payload Updated'
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getApi = async (req, res, next) => {
    const id = req.query.id;
    const appId = req.query.appId;
    try {
        if (id) {
            const fetchApi = await model.apiModel.findById(id);
            if (fetchApi) {
                res.status(200).json(fetchApi);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        } else if (appId) {
            const fetchApplicationApi = await model.apiModel.find({ appId });
            if (fetchApplicationApi) {
                res.status(200).json(fetchApplicationApi);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document for application not found'
                });
            }
        } else {
            const fetchAllApi = await model.apiModel.find({});
            if (fetchAllApi) {
                res.status(200).json(fetchAllApi);
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteApi = async (req, res, next) => {
    const id = req.query.id;
    try {
        if (id) {
            const appDelete = await model.apiModel.findOneAndDelete({
                _id: id
            });
            if (appDelete) {
                res.status(200).json({
                    success: true,
                    message: 'Document deleted'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'id not found'
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// exports.template = async (req, res, next) => {
//     let payload = req.body;
//     const id = req.query.id;
//     try {
//     } catch (error) {
//         next(error);
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };
