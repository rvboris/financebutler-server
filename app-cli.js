var express = require('express'),
    path = require('path'),
    opter = require('opter'),
    Log = require('log'),
    Models = require(path.join(__dirname, 'models', 'index.js')),
    app = express();

app.set('options', opter({
    env: {
        character: 'e',
        argument: 'string',
        defaultValue: 'development',
        description: 'App environment',
        required: false,
        type: String
    },
    syncdb: {
        character: 's',
        description: 'Sync database',
        argument: 'Boolean',
        defaultValue: false,
        type: Boolean
    }
}, require('./package.json').version));

app.set('config', require(path.join(__dirname, 'config.json')));

if (app.get('options').env === 'production') { // workaround for PM2
    app.set('log', new Log('error'));
} else {
    app.set('log', new Log('info'));
    Error.stackTraceLimit = Infinity;
}

process.on('uncaughtException', function(err) {
    app.get('log').error(err.stack);
});

app.set('models', new Models(app));

if (app.set('options').syncdb) {
    app.get('models').syncAll();
}