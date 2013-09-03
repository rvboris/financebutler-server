module.exports = function (app) {

    app.get('/', function (req, res) {
        if (req.session.user) {
            app.get('models').User
                .find(parseInt(req.session.user, 10))
                .success(function (user) {
                    if (!user) {
                        res.render('index');
                        return;
                    }

                    res.render('index', { apiKey: user.apiKey });
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