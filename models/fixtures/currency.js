var path = require('path'),
    _ = require('lodash'),
    Q = require('q'),
    Sequelize = require('sequelize');

module.exports = function(models) {
    var deferred = Q.defer();
    var chainer = new Sequelize.Utils.QueryChainer();
    var currencyDataLength = 0;
    var currencyData = [];

    models.Locale
        .findAll()
        .success(function(locales) {
            _.each(locales, function(locale) {
                var currency = require(path.join(__dirname, locale.code.toLowerCase(), 'currency.json'));
                currencyDataLength += _.size(currency);
                currencyData.push(currency);
            });

            var complete = _.after(currencyDataLength, function() {
                deferred.resolve(chainer.run());
            });

            var currencyToCreate = [];

            for (var code in currencyData[0]) {
                if (currencyData[0].hasOwnProperty(code)) {
                    currencyToCreate.push({ code: code });
                }
            }

            models.Currency
                .bulkCreate(currencyToCreate)
                .success(function() {
                    models.Currency
                        .findAll()
                        .success(function(currencyList) {
                            _.each(locales, function(locale, localeIdx) {
                                _.each(currencyList, function(currency) {
                                    var currencyName = _.find(currencyData[localeIdx],function(cur, code) {
                                        return code === currency.code;
                                    }).name;

                                    models.LocaleCurrency
                                        .create({ name: currencyName })
                                        .success(function(localeCurrency) {
                                            chainer.add(localeCurrency.setLocale(locale));
                                            chainer.add(localeCurrency.setCurrency(currency));
                                            complete();
                                        })
                                        .error(deferred.reject);
                                });
                            });
                        })
                        .error(deferred.reject);
                })
                .error(deferred.reject);
        })
        .error(deferred.reject);

    return deferred.promise;
};