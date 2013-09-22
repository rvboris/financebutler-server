var _ = require('lodash'),
    Q = require('q');

module.exports = function(models, config) {
    var deferred = Q.defer();
    var data = [];

    _.keys(config.locales).forEach(function(locale) {
        data.push({
            name: config.locales[locale],
            code: locale
        });
    });

    deferred.resolve(models.Locale.bulkCreate(data));

    return deferred.promise;
};