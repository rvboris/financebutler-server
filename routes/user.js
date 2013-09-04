module.exports = function (app) {
    app.namespace('/api/:apiKey/user', function () {

        app.get('/', app.get('restRestrict'), function (req, res) {
            res.json({ name: req.user.name, apiKey: req.user.apiKey });
        });

        app.get('/redirect', app.get('restRestrict'), function (req, res) {
            res.redirect('/');
        });

    });
};