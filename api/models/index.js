const mongoose = require('mongoose');
const { dateToIST } = require('../lib/utils');

let apiSchema = new mongoose.Schema(
    {
        appId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'applicationModel',
            required: true
        },
        apiName: {
            type: String,
            required: true
        },
        apiRoute: {
            type: String,
            required: true
        },
        requestType: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            default: 'GET',
            required: true
        },
        queryParams: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {}
        },
        headerParams: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {}
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
            default: {}
        },
        isActive: {
            type: Boolean,
            required: false,
            default: false
        },
        frequency: {
            type: String,
            enum: [
                'Hourly',
                'Daily',
                'Weekly',
                'Monthly',
                'Quaterly',
                'Yearly',
                'Instant'
            ],
            required: false,
            default: null
        },
        triggerTime: {
            type: Date,
            required: false,
            default: null
        },
        cronExpression: {
            type: String,
            required: false,
            default: ''
        },
        history: [
            {
                time: {
                    type: Date,
                    default: () => dateToIST(new Date())
                },
                triggerType: {
                    type: String,
                    enum: ['Manual', 'Automatic']
                }
            }
        ],
        createdAt: {
            type: Date,
            default: () => dateToIST(new Date()),
            required: true
        },
        appName: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        rootPath: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true
    }
);

let applicationSchema = new mongoose.Schema(
    {
        appName: {
            type: String,
            required: true
        },
        description: String,
        rootPath: {
            type: String,
            required: true
        },
        apiList: {
            type: [mongoose.Schema.Types.ObjectId],
            required: false,
            default: []
        },
        auth: {
            basicAuth: {
                type: {
                    username: String,
                    password: String
                },
                required: false,
                default: null
            },
            bearerAuth: {
                token: {
                    type: String,
                    required: false,
                    default: null
                }
            }
        }
    },
    {
        timestamps: true
    }
);

const applicationModel = mongoose.model(
    'applicationModel',
    applicationSchema,
    'cron_application_data'
);
const apiModel = mongoose.model('apiModel', apiSchema, 'cron_api_data');

module.exports = { applicationModel, apiModel };
