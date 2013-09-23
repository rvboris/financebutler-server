var _ = require('lodash');

module.exports = function(app) {
    app.namespace('/api/:apiKey/category', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            req.user
                .getLocale()
                .success(function(locale) {
                    locale
                        .getLocaleCategoryDefaults()
                        .success(function(localeCategoryDefaultList) {
                            req.user
                                .getCategories()
                                .success(function(categories) {
                                    res.send(_.map(categories, function(category) {
                                        var categoryName = category.name;

                                        if (category.categoryDefaultId) {
                                            var defaultCategory = _.find(localeCategoryDefaultList, function(localeCategoryDefault) {
                                                return localeCategoryDefault.categoryDefaultId === category.categoryDefaultId;
                                            });

                                            if (defaultCategory) {
                                                categoryName = defaultCategory.name;
                                            }
                                        }

                                        return {
                                            id: category.id,
                                            parentId: category.parentId,
                                            name: categoryName,
                                            type: category.type
                                        };
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