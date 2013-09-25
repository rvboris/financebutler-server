var _ = require('lodash');

module.exports = function(app) {
    app.namespace('/:apiType(api|api-mobile)/:apiKey/currency', function() {

        app.get('/', app.get('restRestrict'), app.get('cacher').cache('days'), function(req, res) {
            req.user
                .getLocale()
                .success(function(locale) {
                    locale
                        .getLocaleCurrency()
                        .success(function(localeCurrencyList) {
                            var currencyIds = _.map(localeCurrencyList, function(localeCurrency) {
                                return localeCurrency.currencyId;
                            });

                            app.get('models').Currency
                                .findAll({ where: { id: currencyIds } })
                                .success(function(currencyList) {
                                    res.send(_.map(currencyList, function(currency, idx) {
                                        return { id: currency.id, code: currency.code, name: localeCurrencyList[idx].name };
                                    }));
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
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};