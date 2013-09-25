module.exports = function(app) {
    app.namespace('/:apiType(api|api-mobile)/:apiKey/locale-category-default', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            app.get('models').LocaleCategoryDefault
                .findAll()
                .success(function(localeCategoryDefaultList) {
                    res.send(localeCategoryDefaultList);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};