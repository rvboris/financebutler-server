var _ = require('lodash');

module.exports = function(app) {
    app.namespace('/api/:apiKey/locale', function() {
        app.get('/', app.get('restRestrict'), function(req, res) {
            var locales = _(app.get('config').locales).keys().map(function(locale) {
                return { code: locale, name: app.get('config').locales[locale] };
            });
            res.send(locales.value());
        });
    });
};