var http = require('http'),
	fs = require('fs-tools'),
	path = require('path'),
	connectDomain = require('connect-domain'),
	helmet = require('helmet'),
	jsonStore = require('json-store'),
	express = require('express');

module.exports = function(app) {
	app.configure('development', function() {
		app.use(express.errorHandler());
	});

	process.on('uncaughtException', function(err) {
		app.get('log').error(err.stack);
	});

	app.configure(function() {
		app.set('port', app.get('program').port || 3000);
		app.set('view engine', 'html');
		app.engine('html', require('hbs').__express);

		app.use(connectDomain());
		app.use(express.favicon());
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser(app.get('config').get('secret')));
		app.use(express.session({
			secret: app.get('config').get('secret'),
			cookie: {
				maxAge: 60000
			}
		}));

		app.use(express.csrf());
		app.use(helmet.xframe());
		app.use(helmet.contentTypeOptions());
		app.use(helmet.cacheControl());

		app.use(function(req, res, next) {
			app.get('log').info('%s %s', req.method, req.url);
			next();
		});

		app.use(function(req, res, next) {
			res.locals.csrftoken = req.session._csrf;
			next();
		});

		app.use(function(err, req, res, next) {
			app.get('log').error(err);
			res.send(500, 'Houston, we have a problem!\n');
		});

		app.use(app.router);
	});

	app.configure('development', function() {
		app.use(require('stylus').middleware(__dirname + path.sep + 'frontend/app'));
		app.use(express.static(path.join(__dirname, 'frontend/app')));
		app.set('views', __dirname + path.sep + 'frontend/app/');
	});

	app.configure('production', function() {
		app.use(require('stylus').middleware(__dirname + path.sep + 'public'));
		app.use(express.static(path.join(__dirname, 'public')));
		app.set('views', __dirname + path.sep + 'public');
	});

	app.set('models', require(__dirname + path.sep + 'models' + path.sep + 'index.js')(app));

	require(__dirname + path.sep + 'auth.js')(app);

	fs.walk(__dirname + path.sep + 'routes', function(routeFile) {
		require(routeFile)(app);
	});

	http.createServer(app).listen(app.get('port'), function() {
		app.get('log').info('worker listening on port %s', app.get('port'));
	});
};