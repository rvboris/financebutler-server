var fs = require('fs-tools'),
    path = require('path'),
    opter = require('opter'),
    helmet = require('helmet'),
    express = require('express'),
    params = require('express-params'),
    Log = require('log'),
    Models = require(path.join(__dirname, 'models', 'index.js')),
    SessionStore = require(path.join(__dirname, 'system', 'session.js'))(express),
    namespace = require('express-namespace'),
    device = require('express-device'),
    locale = require('locale'),
    _ = require('lodash'),
    app = express();

require('connect-domain');

app.set('options', opter({
    env: {
        character: 'e',
        argument: 'string',
        defaultValue: 'development',
        description: 'App environment',
        required: false,
        type: String
    },
    port: {
        character: 'p',
        argument: 'number',
        defaultValue: 3000,
        description: 'App listen port',
        required: false,
        type: Number
    },
    database: {
        character: 'd',
        argument: 'string',
        description: 'Force database env',
        required: false,
        type: String
    },
    outh: {
        character: 'o',
        argument: 'string',
        description: 'Force oauth env',
        required: false,
        type: String
    }
}, require('./package.json').version));

app.set('config', require(path.join(__dirname, 'config.json')));

params.extend(app);

if (app.get('options').env === 'production') { // workaround for PM2
    app.set('log', new Log('error'));
} else {
    app.set('log', new Log('info'));
    Error.stackTraceLimit = Infinity;
}

process.on('uncaughtException', function (err) {
    app.get('log').error(err.stack);
});

app.set('models', new Models(app));

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(express.bodyParser());
app.use(device.capture());
app.use(express.methodOverride());
app.use(express.cookieParser(app.get('config').secret));
app.use(express.session({
    store: new SessionStore(app),
    secret: app.get('config').secret
}));

app.use(locale(_.keys(app.get('config').locales)));

app.use(helmet.xframe());
app.use(helmet.contentTypeOptions());
app.use(helmet.cacheControl());

app.use(function (req, res, next) {
    app.get('log').info('%s %s', req.method, req.url);
    next();
});

app.use(function (err, req, res, next) {
    app.get('log').error(err);
    res.send(500, 'Houston, we have a problem!\n');
    next(err);
});

require(path.join(__dirname, 'system', 'auth.js'))(app);

fs.walkSync(path.join(__dirname, 'routes'), function (routeFile) {
    require(routeFile)(app);
});

app.use(app.router);

if (app.get('options').env === 'production') {
    app.set('views', path.join(__dirname, 'public'));
} else {
    app.use(express.errorHandler());
    app.use(require('stylus').middleware(path.join(__dirname, 'frontend/app')));
    app.use(express.static(path.join(__dirname, 'frontend', 'app')));
    app.set('views', path.join(__dirname, 'frontend', 'app'));
}

app.listen(app.get('options').port, function () {
    app.get('log').info('worker listening on port %s', app.get('options').port);
});