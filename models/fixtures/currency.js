var path = require('path');

module.exports = function(models, config) {
    var data = [];

    config.locales.forEach(function(locale) {
        var currency = require(path.join(__dirname, locale.toLowerCase(), 'currency.json'));

        for (var code in currency) {
            data.push({
                name: currency[code].name,
                code: code,
                locale: locale
            });
        }
    });

    return models.Currency.bulkCreate(data);
};