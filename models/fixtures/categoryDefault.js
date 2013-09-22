var path = require('path'),
    _ = require('lodash'),
    Q = require('q'),
    Sequelize = require('sequelize');

module.exports = function(models) {
    var deferred = Q.defer();
    var chainer = new Sequelize.Utils.QueryChainer();
    var categoryDefaultData = [];

    var flatten = function(root) {
        _.each(root, function(category) {
            categoryDefaultData.push({ name: category.name, type: category.type });

            if (category.childrens) {
                flatten(category.childrens);
            }
        });
    };

    models.Locale
        .findAll()
        .success(function(locales) {
            _.each(locales, function(locale) {
                flatten(require(path.join(__dirname, locale.code.toLowerCase(), 'categoryDefault.json')));
            });

            var complete = _.after(categoryDefaultData.length, function() {
                deferred.resolve(chainer.run());
            });

            var createChainer = new Sequelize.Utils.QueryChainer();

            _.each(categoryDefaultData, function() {
                createChainer.add(models.CategoryDefault.create());
            });

            createChainer
                .run()
                .success(function() {
                    models.CategoryDefault
                        .findAll()
                        .success(function(categoryDefaultList) {
                            _.each(locales, function(locale) {
                                _.each(categoryDefaultList, function(categoryDefault, idx) {
                                    models.LocaleCategoryDefault
                                        .create({ name: categoryDefaultData[idx].name })
                                        .success(function(localeCategoryDefault) {
                                            chainer.add(localeCategoryDefault.setLocale(locale));
                                            chainer.add(localeCategoryDefault.setCategoryDefault(categoryDefault));
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