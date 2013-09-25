var path = require('path'),
    _ = require('lodash'),
    Q = require('q'),
    Sequelize = require('sequelize'),
    traverse = require('traverse'),
    uuid = require('uuid');

module.exports = function(models) {
    var deferred = Q.defer();
    var chainer = new Sequelize.Utils.QueryChainer();
    var categoryDefaultData = [];

    models.Locale
        .findAll()
        .success(function(locales) {
            _.each(locales, function(locale) {
                var src = require(path.join(__dirname, locale.code.toLowerCase(), 'categoryDefault.json'));
                var leaves = traverse(src).reduce(function(acc, x) {
                    if (this.isLeaf && this.key === 'name') {
                        acc.push(x);
                    }

                    return acc;
                }, []);

                categoryDefaultData = categoryDefaultData.concat(leaves);
            });

            var complete = _.after(categoryDefaultData.length, function() {
                deferred.resolve(chainer.run());
            });

            var createChainer = new Sequelize.Utils.QueryChainer();

            var categoriesPerLocale = categoryDefaultData.length / locales.length;

            for (var i = 0; i < categoriesPerLocale; i++) {
                createChainer.add(models.CategoryDefault.create({ uuid: uuid.v1() }));
            }

            createChainer
                .run()
                .success(function() {
                    models.CategoryDefault
                        .findAll()
                        .success(function(categoryDefaultList) {
                            _.each(locales, function(locale, localeIdx) {
                                _.each(categoryDefaultList, function(categoryDefault, categoryIdx) {
                                    models.LocaleCategoryDefault
                                        .create({
                                            name: categoryDefaultData[categoryIdx + localeIdx * categoriesPerLocale],
                                            localeId: locale.id,
                                            categoryDefaultId: categoryDefault.id
                                        })
                                        .success(complete)
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