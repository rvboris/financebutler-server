var _ = require('lodash'),
    Q = require('q'),
    uuid = require('uuid');

module.exports = function(models, config) {
    var deferred = Q.defer();
    var data = [];

    _.keys(config.locales).forEach(function(locale) {
        data.push({
            name: config.locales[locale],
            code: locale,
            uuid: uuid.v1()
        });
    });

    deferred.resolve(models.Locale.bulkCreate(data));

    return deferred.promise;
};