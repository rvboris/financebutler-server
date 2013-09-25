module.exports = function(app) {
    app.namespace('/:apiType(api|api-mobile)/:apiKey/locale-currency', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            app.get('models').LocaleCurrency
                .findAll()
                .success(function(localeCurrencyList) {
                    res.send(localeCurrencyList);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};