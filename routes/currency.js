module.exports = function (app) {
    app.namespace('/api/:apiKey/currency', function () {

        app.get('/', app.get('restRestrict'), function (req, res) {
            app.get('models').Currency
                .findAll()
                .success(function (currency) {
                    res.json(currency);
                })
                .error(function (err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};