// eslint-disable-next-line
const config = require('./config'),
    { scheduleCronJob } = require('./api/controller'),
    models = require('./api/models'),
    mongoose = require('mongoose'),
    xss = require('xss-clean'),
    hpp = require('hpp');
// dotenv = require('dotenv').config(), //in case local break, add this to top
const express = require('express'),
    app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


require('./api/routes')(app);

const runCronBacklog = async () => {
    const cronBacklog = await models.apiModel.find({ isActive: true });
    if (cronBacklog.length > 0) {
        // eslint-disable-next-line no-console
        console.log('Cron Backlog Scheduler Started');
        cronBacklog.forEach((result) => {
            scheduleCronJob(result);
        });
    } else {
        // eslint-disable-next-line no-console
        console.log('No backlog Cron to schedule');
    }
};

app.use(function (req, res, next) {
    try {
        if (req.body) {
            let payload = JSON.stringify(req.body);
            let preventList = ['<script>', '</script>'];
            let loopbreak = false,
                errorFound = false;
            preventList.map((item) => {
                if (!loopbreak) {
                    if (payload.includes(item)) {
                        errorFound = true;
                        loopbreak = true;
                    }
                }
            });
            if (errorFound) {
                return res.status(500).send({ data: 'Something went wrong' });
            } else {
                next();
            }
        } else {
            next();
        }
    } catch (e) {
        res.status(500).send('Something went wrong');
    }
});

app.use(hpp());
app.use(xss());

mongoose.connect(encodeURI(config.dbPath), {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('connected', function () {
    // eslint-disable-next-line no-console
    console.log('connected to mongoDB instance');
});
db.on('error', function () {
    // eslint-disable-next-line no-console
    console.log('error connecting to mongoDB instance');
});

app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on port: ${config.port}`);
});

runCronBacklog();
