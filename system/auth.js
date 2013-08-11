var authom = require('authom'),
	uuid = require('uuid');

module.exports = function(app) {
	var oauthConfig = app.get('config').get('oauth')[app.settings.env];

	var getOAuthData = function(auth) {
		var user = {};

		switch(auth.service) {
			case 'google':
				user.providerId = auth.data.id;
				user.name = auth.data.name;
				break;
			case 'twitter':
				user.providerId = auth.data.user_id;
				user.name = auth.data.screen_name;
				break;
			case 'facebook':
				user.providerId = auth.data.id;
				user.name = auth.data.name;
				break;
			case 'vkontakte':
				user.providerId = auth.data.response[0].id.toString();
				user.name = auth.data.response[0].first_name + ' ' + auth.data.response[0].last_name;
		}

		user.provider = auth.service;
		user.apiKey = uuid.v1();

		return user;
	};

	for (var service in oauthConfig) {
		var options = oauthConfig[service];
		options.service = service;
		authom.createServer(options);
	}

	authom.on('auth', function(req, res, auth) {
		auth = getOAuthData(auth);

		var errFn = function(err) {
			app.get('log').error(err.stack);
			res.redirect('/#/error/500');
		};

		var successFn = function(user) {
			req.session.regenerate(function(){
				req.session.user = user.id.toString();
				res.redirect('/');
			});
		};

		app.get('models').Provider
			.findOrCreate({ providerId: auth.providerId, provider: auth.provider })
			.success(function(provider) {
				provider
					.getUser()
					.success(function(user) {
						if (user) {
							return successFn(user);
						}

						app.get('models').User
							.create({ name: auth.name, apiKey: auth.apiKey })
							.success(function(user) {
								user
									.setProviders([provider])
									.success(function() {
										successFn(user);
									})
									.error(errFn);
							})
							.error(errFn)
					})
					.error(errFn)
			})
			.error(errFn);
	});

	authom.on('error', function(req, res, data) {
		app.get('log').error(data);
		res.redirect('/#/error/401');
	});

	app.set('restrict', function(req, res, next) {
		if (!req.session.user) {
			return res.send(401);
		}

		app.get('models').User
			.find(parseInt(req.session.user))
			.success(function(user) {
				if (!user) {
					return res.send(401);
				}
				
				req.user = user;
				next();
			})
			.error(next);
	});

	app.set('restRestrict', function(req, res, next) {
		if (!req.params.apiKey) {
			return res.send(401);
		}

		app.get('models').User
			.find({ where: { apiKey: req.params.apiKey }})
			.success(function(user) {
				if (!user) {
					return res.send(401);
				}

				req.user = user;
				next();
			})
			.error(next);
	});

	app.get('/auth/:service', authom.app);

	app.get('/logout', app.get('restrict'), function(req, res) {
		req.session.destroy(function() {
			res.clearCookie('connect.sid', { path: '/' });
			res.redirect('/#/auth');
		});
	});
};