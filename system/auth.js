var authom = require('authom'),
    uuid = require('uuid'),
    Twit = require('twit'),
    Q = require('q');

module.exports = function (app) {
    var oauthConfig = app.get('config').oauth[app.get('options').oauth || app.get('options').env];

    var getOAuthData = function (auth) {
        var deferred = Q.defer();

        var user = {
            provider: auth.service,
            apiKey: uuid.v1(),
            email: null,
            picture: null
        };

        switch (auth.service) {
        case 'google':
            user.providerId = auth.data.id;
            user.name = auth.data.name;

            if (auth.data.verified_email) {
                user.email = auth.data.email;
            }

            user.picture = auth.data.picture;

            deferred.resolve(user);
            break;
        case 'twitter':
            user.providerId = auth.data.user_id;
            user.name = auth.data.screen_name;

            new Twit({
                consumer_key: oauthConfig.twitter.id,
                consumer_secret: oauthConfig.twitter.secret,
                access_token: auth.token,
                access_token_secret: auth.secret
            }).get('users/show', { screen_name: auth.data.screen_name }, function(err, result) {
                user.picture = result.profile_image_url;
                deferred.resolve(user);
            });

            break;
        case 'facebook':
            user.providerId = auth.data.id;
            user.name = auth.data.name;
            user.email = auth.data.email;
            user.picture = auth.data.picture.data.url;

            deferred.resolve(user);
            break;
        case 'vkontakte':
            user.providerId = auth.data.response[0].id.toString();
            user.name = auth.data.response[0].screen_name;
            user.picture = auth.data.response[0].photo;

            deferred.resolve(user);
        }

        return deferred.promise;
    };

    for (var service in oauthConfig) {
        var options = oauthConfig[service];
        options.service = service;
        authom.createServer(options);
    }

    var authorize = function(req, res, auth) {
        var errFn = function (err) {
            app.get('log').error(err.stack);
            res.redirect('/#/error/500');
        };

        var successFn = function (user) {
            req.session.regenerate(function () {
                req.session.user = user.id.toString();

                if (req.device.type === 'phone' || req.device.type === 'tablet') {
                    res.redirect('/api/' + user.apiKey + '/user/redirect');
                    return;
                }

                res.redirect('/');
            });
        };

        app.get('models').Provider
            .findOrCreate({ providerId: auth.providerId, provider: auth.provider })
            .success(function (provider) {
                provider
                    .getUser()
                    .success(function (user) {
                        if (user) {
                            if (auth.email && !user.email) {
                                user.email = auth.email;
                            }

                            if (auth.picture && !user.picture) {
                                user.picture = auth.picture;
                            }

                            user
                                .save()
                                .success(function(user) {
                                    successFn(user);
                                })
                                .error(errFn);

                            return;
                        }

                        var userModel = app.get('models').User;

                        if (auth.email) {
                            userModel = userModel.findOrCreate({ email: auth.email }, { name: auth.name, apiKey: auth.apiKey, picture: auth.picture });
                        } else {
                            userModel = userModel.create({ name: auth.name, apiKey: auth.apiKey, email: auth.email, picture: auth.picture });
                        }

                        userModel
                            .success(function (user) {
                                user
                                    .addProvider(provider)
                                    .success(function () {
                                        successFn(user);
                                    })
                                    .error(errFn);
                            })
                            .error(errFn);
                    })
                    .error(errFn);
            })
            .error(errFn);
    };

    authom.on('auth', function (req, res, auth) {
        getOAuthData(auth).then(function(auth) {
            authorize(req, res, auth);
        });
    });

    authom.on('error', function (req, res, data) {
        app.get('log').error(data);
        res.redirect('/#/error/401');
    });

    app.set('restrict', function (req, res, next) {
        if (!req.session.user) {
            return res.send(401);
        }

        app.get('models').User
            .find(parseInt(req.session.user, 10))
            .success(function (user) {
                if (!user) {
                    return res.send(401);
                }

                req.user = user;
                next();
            })
            .error(next);
    });

    app.set('restRestrict', function (req, res, next) {
        if (!req.params.apiKey) {
            return res.send(401);
        }

        app.get('models').User
            .find({ where: { apiKey: req.params.apiKey }})
            .success(function (user) {
                if (!user) {
                    return res.send(401);
                }

                req.user = user;
                next();
            })
            .error(next);
    });

    app.get('/auth/:service', authom.app);

    app.get('/logout', app.get('restrict'), function (req, res) {
        req.session.destroy(function () {
            res.clearCookie('connect.sid', { path: '/' });
            res.redirect('/#/auth');
        });
    });
};