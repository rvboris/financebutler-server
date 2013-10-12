module.exports = function(app) {
    app.namespace('/:apiType(api-mobile)/:apiKey/category-default', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            app.get('models').CategoryDefault
                .findAll()
                .success(function(categoryDefaultList) {
                    res.send(categoryDefaultList);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

    });
};