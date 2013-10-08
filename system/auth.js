var authom = require('authom'),
    uuid = require('uuid'),
    Twit = require('twit'),
    Q = require('q'),
    Sequelize = require('sequelize'),
    _ = require('lodash'),
    path = require('path'),
    TreeModel = require('tree-model');

module.exports = function(app) {
    var oauthConfig = app.get('config').oauth[app.get('options').oauth || app.get('options').env];

    var getOAuthData = function(auth) {
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
        if (oauthConfig.hasOwnProperty(service)) {
            var options = oauthConfig[service];
            options.service = service;
            authom.createServer(options);
        }
    }

    var authorize = function(req, res, auth) {
        var errFn = function(err) {
            app.get('log').error(err.stack);
            res.redirect('/#/error/500');
        };

        var successFn = function(user, locale) {
            if (locale !== true) {
                app.get('models').CategoryDefault
                    .findAll()
                    .success(function(categoryDefaultList) {
                        var chainer = new Sequelize.Utils.QueryChainer();

                        _.each(categoryDefaultList, function(categoryDefault) {
                            chainer.add(app.get('models').Category.create({ userId: user.id, categoryDefaultId: categoryDefault.id, editable: true }));
                        });

                        chainer
                            .run()
                            .success(function() {
                                locale.getLocaleCategoryDefaults()
                                    .success(function(localeCategoryDefaultList) {
                                        var categoriesSource = require(path.join(__dirname, '..', 'models', 'fixtures', locale.code.toLowerCase(), 'categoryDefault.json'));

                                        app.get('models').Category
                                            .findAll({ where: { userId: user.id } })
                                            .success(function(userCategories) {
                                                var setParents = function(root, parent) {
                                                    _.each(root, function(categorySrc) {
                                                        var userCategory = _.find(userCategories, function(userCategory) {
                                                            return userCategory.categoryDefaultId === categorySrc.id;
                                                        });

                                                        if (userCategory) {
                                                            if (parent) {
                                                                userCategory.parentId = parent.id;
                                                            }

                                                            chainer.add(userCategory.save());
                                                        }

                                                        if (categorySrc.children) {
                                                            setParents(categorySrc.children, userCategory);
                                                        }
                                                    });
                                                };

                                                _.each(categoriesSource, function(category) {
                                                    var categoriesTree = new TreeModel();
                                                    var categoriesRoot = categoriesTree.parse(category);

                                                    categoriesRoot.walk(function(node) {
                                                        var categoryDefault = _.find(localeCategoryDefaultList, function(localeCategoryDefault) {
                                                            return localeCategoryDefault.name === node.model.name;
                                                        });

                                                        if (!categoryDefault) {
                                                            return;
                                                        }

                                                        node.model.id = categoryDefault.categoryDefaultId;

                                                        var userCategory = _.find(userCategories, function(category) {
                                                            return category.categoryDefaultId === categoryDefault.categoryDefaultId;
                                                        });

                                                        if (!userCategory) {
                                                            return;
                                                        }

                                                        userCategory.type = node.model.type;
                                                        userCategory.editable = !_.isUndefined(node.model.editable) ? node.model.editable : true;
                                                    });
                                                });

                                                setParents(categoriesSource);

                                                chainer
                                                    .run()
                                                    .success(function() {
                                                        createSession(req, res, user);
                                                    })
                                                    .error(errFn);
                                            })
                                            .error(errFn);
                                    })
                                    .error(errFn);
                            })
                            .error(errFn);
                    })
                    .error(errFn);
                return;
            }

            createSession(req, res, user);
        };

        var createSession = function(req, res, user) {
            req.session.regenerate(function() {
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
            .success(function(provider) {
                provider
                    .getUser()
                    .success(function(user) {
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
                                    successFn(user, true);
                                })
                                .error(errFn);

                            return;
                        }

                        app.get('models').Locale
                            .find({ where: { code: req.locale } })
                            .success(function(locale) {
                                var userModel = app.get('models').User;

                                if (auth.email) {
                                    userModel = userModel.findOrCreate({
                                        email: auth.email
                                    }, {
                                        name: auth.name,
                                        apiKey: auth.apiKey,
                                        picture: auth.picture,
                                        localeId: locale.id
                                    });
                                } else {
                                    userModel = userModel.create({
                                        name: auth.name,
                                        apiKey: auth.apiKey,
                                        email: auth.email,
                                        picture: auth.picture,
                                        localeId: locale.id
                                    });
                                }

                                userModel
                                    .success(function(user) {

                                        user
                                            .addProvider(provider)
                                            .success(function(user) {
                                                successFn(user, locale);
                                            })
                                            .error(errFn);
                                    })
                                    .error(errFn);
                            })
                            .error(errFn);
                    })
                    .error(errFn);
            })
            .error(errFn);
    };

    authom.on('auth', function(req, res, auth) {
        getOAuthData(auth).then(function(auth) {
            authorize(req, res, auth);
        });
    });

    authom.on('error', function(req, res, data) {
        app.get('log').error(data);
        res.redirect('/#/error/401');
    });

    app.set('restrict', function(req, res, next) {
        if (!req.session.user) {
            res.send(401);
            return;
        }

        app.get('models').User
            .find(parseInt(req.session.user, 10))
            .success(function(user) {
                if (!user) {
                    res.send(401);
                    return;
                }

                req.user = user;
                next();
            })
            .error(next);
    });

    app.set('restRestrict', function(req, res, next) {
        if (!req.params.apiKey) {
            res.send(401);
            return;
        }

        app.get('models').User
            .find({ where: { apiKey: req.params.apiKey }, include: [ app.get('models').Locale ]})
            .success(function(user) {
                if (!user) {
                    res.send(401);
                    return;
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