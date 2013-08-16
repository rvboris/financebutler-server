var fs = require('fs-tools'),
	path = require('path'),
	connectDomain = require('connect-domain'),
	helmet = require('helmet'),
	jsonStore = require('json-store'),
	express = require('express'),
	hbs = require('hbs'),
	Models = require(path.join(__dirname, 'models', 'index.js'));

var SessionStore = require(path.join(__dirname, 'system', 'session.js'))(express);

module.exports = function(app) {
	app.configure(function() {
		app.set('models', new Models(app));
		app.set('port', app.get('program').port);
		app.set('view engine', 'html');
		app.engine('html', require('hbs').__express);

		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser(app.get('config').get('secret')));
		app.use(express.session({
			store: new SessionStore(app),
			secret: app.get('config').get('secret')
		}));

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

		require(path.join(__dirname, 'system', 'auth.js'))(app);

		fs.walkSync(path.join(__dirname, 'routes'), function(routeFile) {
			require(routeFile)(app);
		});

		app.use(app.router);
	});

	process.on('uncaughtException', function(err) {
		app.get('log').error(err.stack);
	});

	app.configure('development', function() {
		app.use(express.errorHandler());
		app.use(require('stylus').middleware(path.join(__dirname, 'frontend/app')));
		app.use(express.static(path.join(__dirname, 'frontend', 'app')));
		app.set('views', path.join(__dirname, 'frontend', 'app'));
	});

	app.configure('production', function() {
		app.use(require('stylus').middleware(path.join(__dirname, 'public')));
		app.use(express.static(path.join(__dirname, 'public')));
		app.set('views', path.join(__dirname, 'public'));
	});

	app.listen(app.get('port'), function() {
		app.get('log').info('worker listening on port %s', app.get('port'));
	});
};