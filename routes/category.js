var _ = require('lodash'),
    Sequelize = require('sequelize');

module.exports = function(app) {
    app.param('categoryId', Number);

    app.namespace('/:apiType(api|api-mobile)/:apiKey/category', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            req.user
                .getLocale()
                .success(function(locale) {
                    locale
                        .getLocaleCategoryDefaults()
                        .success(function(localeCategoryDefaultList) {
                            if (_.isUndefined(localeCategoryDefaultList)) {
                                res.send(500);
                                return;
                            }
                            req.user
                                .getCategories()
                                .success(function(categories) {
                                    if (_.isUndefined(categories)) {
                                        res.send([]);
                                        return;
                                    }

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
                                            type: category.type,
                                            editable: category.editable
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

        app.post('/', app.get('restRestrict'), function(req, res) {
            if (_.isUndefined(req.body.name) || _.isUndefined(req.body.type)) {
                res.send(400);
                return;
            }

            if (req.body.parent) {
                req.body.parent = _.parseInt(req.body.parent);
            }

            var createCategory = function(parentCategory) {
                var categoryData = {
                    userId: req.user.id,
                    name: req.body.name,
                    editable: true,
                    type: req.body.type
                };

                if (parentCategory) {
                    if (req.body.type !== parentCategory.type) {
                        res.send(400);
                        return;
                    }

                    categoryData.parentId = parentCategory.id;
                }

                app.get('models').Category
                    .create(categoryData)
                    .success(function(category) {
                        res.send(category);
                    })
                    .error(function(err) {
                        app.get('log').error(err.stack);
                        res.send(500);
                    });
            };

            if (req.body.parent) {
                app.get('models').Category
                    .find({ where: { id: req.body.parent, userId: req.user.id } })
                    .success(function(parentCategory) {
                        if (_.isUndefined(parentCategory)) {
                            res.send(404);
                            return;
                        }

                        createCategory(parentCategory);
                    })
                    .error(function(err) {
                        app.get('log').error(err.stack);
                        res.send(500);
                    });
                return;
            }

            createCategory();
        });

        app.put('/:categoryId', app.get('restRestrict'), function(req, res) {
            if (_.isUndefined(req.body.name) || _.isUndefined(req.body.type) || _.isUndefined(req.body.parent)) {
                res.send(400);
                return;
            }

            if (!_.isNull(req.body.parent)) {
                req.body.parent = _.parseInt(req.body.parent);
            }

            var postProcessChilds = function(category, childs) {
                var ids = _.map(childs, function(child) {
                    return child.id;
                });

                app.get('models').Category
                    .update({ type: category.type }, { id: ids, userId: req.user.id })
                    .success(function() {
                        res.send(category);
                    })
                    .error(function(err) {
                        app.get('log').error(err.stack);
                        res.send(500);
                    });
            };

            var updateCategory = function(category) {
                category
                    .save()
                    .success(function(category) {
                        app.get('models').Category
                            .count({ where: { parentId: category.id, userId: req.user.id } })
                            .success(function(childsCount) {
                                if (childsCount > 0) {
                                    app.get('models').Category
                                        .findAll({ where: { userId: req.user.id } })
                                        .success(function(userCategories) {
                                            if (_.isUndefined(userCategories)) {
                                                res.send(500);
                                                return;
                                            }

                                            postProcessChilds(category, app.get('helpers').categoryChildrens(userCategories, category.id));
                                        })
                                        .error(function(err) {
                                            app.get('log').error(err.stack);
                                            res.send(500);
                                        });
                                }

                                res.send(category);
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
            };

            app.get('models').Category
                .find({ where: { id: req.params.categoryId, userId: req.user.id } })
                .success(function(category) {
                    if (_.isUndefined(category)) {
                        res.send(404);
                        return;
                    }

                    if (category.name !== req.body.name) {
                        category.categoryDefaultId = null;
                    }

                    category.name = req.body.name;
                    category.type = req.body.type;

                    if (!_.isNull(req.body.parent)) {
                        app.get('models').Category
                            .find({ where: { id: req.body.parent, userId: req.user.id } })
                            .success(function(parentCategory) {
                                if (_.isUndefined(parentCategory)) {
                                    res.send(404);
                                    return;
                                }

                                category.parentId = parentCategory.id;
                                updateCategory(category);
                            })
                            .error(function(err) {
                                app.get('log').error(err.stack);
                                res.send(500);
                            });
                        return;
                    }

                    category.parentId = null;
                    updateCategory(category);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.delete('/:categoryId', app.get('restRestrict'), function(req, res) {
            req.user
                .getCategories()
                .success(function(categories) {
                    var categoryToDelete = _.find(categories, function(category) {
                        return category.id === req.params.categoryId;
                    });

                    if (_.isUndefined(categoryToDelete)) {
                        res.send(404);
                        return;
                    }

                    var childrens = app.get('helpers').categoryChildrens(categories, categoryToDelete.id);
                    var chainer = new Sequelize.Utils.QueryChainer();

                    _.each(childrens, function(children) {
                        chainer.add(children.destroy());
                    });

                    chainer.add(categoryToDelete.destroy());

                    chainer
                        .run()
                        .success(function() {
                            res.send(200);
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