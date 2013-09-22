var _ = require('lodash');

module.exports = function (app) {

    app.get('/', function (req, res) {
        if (req.session.user) {
            app.get('models').User
                .find(_.parseInt(req.session.user))
                .success(function (user) {
                    if (!user) {
                        res.render('index', {
                            locale: req.locale
                        });
                        return;
                    }

                    user
                        .getLocale()
                        .success(function(locale) {
                            res.render('index', {
                                apiKey: user.apiKey,
                                locale: locale.code
                            });
                        })
                        .error(function(err) {
                            app.get('log').error(err.stack);
                            res.redirect('/#/error/500');
                        });
                })
                .error(function (err) {
                    app.get('log').error(err.stack);
                    res.redirect('/#/error/500');
                });
        } else {
            res.render('index');
        }
    });

};