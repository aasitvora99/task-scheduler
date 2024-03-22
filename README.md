# task-scheduler
#### An API service used to schedule cron jobs targetting to external APIs

## What?
Say you want to fetch some data at regular intervals into your project and this data is to be fetched from external APIs, use this application to create/schedule cron jobs and save data to ur database (i used mongo here)

## How does it work

``` mermaid
classDiagram
    class apiSchema {
        _id: ObjectId
        appId: ObjectId
        apiName: String
        apiRoute: String
        requestType: String
        queryParams: Mixed
        headerParams: Mixed
        payload: Mixed
        isActive: Boolean
        frequency: String
        triggerTime: Date
        cronExpression: String
        history: Array
        createdAt: Date
        appName: String
        description: String
        rootPath: String
    }

    class applicationSchema {
        _id: ObjectId
        appName: String
        description: String
        rootPath: String
        apiList: Array
        auth: Object
    }

    apiSchema *-- applicationSchema : appId

```

- 2 schemas `Application` and `API` where we store application and api data respectively
- Each application contains a list of APIs which are cron jobs to be targetted
- 2 ways to run the jobs, Automatic or Manual. frequency field in APIs help us differentiate this. If `'Instant'`, its manual else the later
- If the server restarts, we'll pick up from where we left off by checking the `isActive` status

## How to run
1. `npm i`
2. `npm run dev`: for running locally (nodemon enabled)
3. `npm start` for production

## Secrets
1. Create a `.env` file at the root and initialize all variables you'll need from `config.js`
2. Example `securityKey: process.env.NODE_APP_SECURITY_KEY` you will make an entry in .env called NODE_APP_SECURITY_KEY: XYZ

## Contributions
- Be nice, create a PR and I'll review them