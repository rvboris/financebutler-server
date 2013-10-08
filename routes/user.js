module.exports = function(app) {
    app.param('userId', Number);

    app.namespace('/:apiType(api|api-mobile)/:apiKey/user', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            res.send([req.user]);
        });

        app.get('/redirect', app.get('restRestrict'), function(req, res) {
            res.redirect('/');
        });

        app.put('/:userId', app.get('restRestrict'), function(req, res) {
            if (!req.body.name || !req.body.email || !req.body.locale) {
                res.send(400);
                return;
            }

            app.get('models').Locale
                .find({ where: { code: req.body.locale } })
                .success(function(locale) {
                    if (!locale) {
                        res.send(404);
                        return;
                    }

                    req.user.name = req.body.name;
                    req.user.email = req.body.email;
                    req.user.localeId = locale.id;
                    req.user.locale = locale;

                    req.user
                        .save()
                        .success(function(user) {
                            res.send(user);
                        })
                        .error(function(err) {
                            app.get('log').error(err.stack);
                            res.send(500);
                        });
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.delete('/:userId', app.get('restRestrict'), function(req, res) {
            req.user
                .destroy()
                .success(function() {
                    res.send(200);
                })
                .error(function(err) {
                    console.log(err);
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};