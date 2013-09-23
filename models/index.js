var Sequelize = require('sequelize'),
    path = require('path'),
    _ = require('lodash'),
    Q = require('q');

module.exports = function(app) {
    var config = app.get('config').db[app.get('options').database || app.get('options').env];

    config.options.logging = config.options.logging === 'true';

    if (config.options.logging) {
        config.options.logging = function(msg) {
            app.get('log').info(msg);
        };
    }

    var models = [
        'Session',
        'User',
        'Provider',
        'Locale',
        'Currency',
        'LocaleCurrency',
        'Account',
        'Operation',
        'Category',
        'CategoryDefault',
        'LocaleCategoryDefault',
        'Place',
        'Month',
        'Plan'
    ];

    this.sequelize = new Sequelize(config.name, config.username, config.password, config.options);

    _.each(models, function(model) {
        this[model] = this.sequelize.import(path.join(__dirname, model.charAt(0).toLowerCase() + model.slice(1)));
    }, this);

    this.Provider.belongsTo(this.User, { as: 'User', foreignKey: 'userId', onDelete: 'cascade' });
    this.User.hasMany(this.Provider, { as: 'Providers', foreignKey: 'userId' });

    this.User.belongsTo(this.Locale, { as: 'Locale', foreignKey: 'localeId', onDelete: 'restrict' });
    this.Locale.hasMany(this.User, { as: 'Users', foreignKey: 'localeId' });

    this.Account.belongsTo(this.User, { as: 'User', foreignKey: 'userId', onDelete: 'cascade' });
    this.User.hasMany(this.Account, { as: 'Accounts', foreignKey: 'userId' });

    this.Operation.belongsTo(this.Category, { as: 'Category', foreignKey: 'categoryId', onDelete: 'restrict' });
    this.Category.hasMany(this.Operation, { as: 'Operations', foreignKey: 'categoryId' });

    this.Operation.belongsTo(this.Place, { as: 'Place', foreignKey: 'placeId', onDelete: 'restrict' });
    this.Place.hasMany(this.Operation, { as: 'Operations', foreignKey: 'placeId' });

    this.Operation.belongsTo(this.Account, { as: 'Account', foreignKey: 'accountId', onDelete: 'cascade' });
    this.Account.hasMany(this.Operation, { as: 'Operations', foreignKey: 'accountId' });

    this.Plan.belongsTo(this.Account, { as: 'Account', foreignKey: 'accountId', onDelete: 'cascade' });
    this.Account.hasMany(this.Plan, { as: 'Plans', foreignKey: 'accountId' });

    this.Plan.belongsTo(this.Category, { as: 'Category', foreignKey: 'categoryId', onDelete: 'restrict' });
    this.Category.hasMany(this.Plan, { as: 'Plans', foreignKey: 'categoryId' });

    this.Month.belongsTo(this.Account, { as: 'Account', foreignKey: 'accountId', onDelete: 'cascade' });
    this.Account.hasMany(this.Month, { as: 'Months', foreignKey: 'accountId' });

    this.LocaleCurrency.belongsTo(this.Locale, { as: 'Locale', foreignKey: 'localeId', onDelete: 'restrict' });
    this.Locale.hasMany(this.LocaleCurrency, { as: 'LocaleCurrency', foreignKey: 'localeId' });

    this.LocaleCurrency.belongsTo(this.Currency, { as: 'Currency', foreignKey: 'currencyId', onDelete: 'restrict' });
    this.Currency.hasMany(this.LocaleCurrency, { as: 'LocaleCurrency', foreignKey: 'currencyId' });

    this.Account.belongsTo(this.Currency, { as: 'Currency', foreignKey: 'currencyId', onDelete: 'restrict' });
    this.Currency.hasMany(this.Account, { as: 'Accounts', foreignKey: 'currencyId' });

    this.LocaleCategoryDefault.belongsTo(this.Locale, { as: 'Locale', foreignKey: 'localeId', onDelete: 'restrict' });
    this.Locale.hasMany(this.LocaleCategoryDefault, { as: 'LocaleCategoryDefaults', foreignKey: 'localeId' });

    this.LocaleCategoryDefault.belongsTo(this.CategoryDefault, { as: 'CategoryDefault', foreignKey: 'categoryDefaultId', onDelete: 'restrict' });
    this.CategoryDefault.hasMany(this.LocaleCategoryDefault, { as: 'LocaleCategoryDefaults', foreignKey: 'categoryDefaultId' });

    this.Category.belongsTo(this.CategoryDefault, { as: 'Default', foreignKey: 'categoryDefaultId', onDelete: 'restrict' });
    this.Category.hasMany(this.Category, { as: 'Childrens', foreignKey: 'parentId', useJunctionTable: false });

    this.Category.belongsTo(this.User, { as: 'User', foreignKey: 'userId', onDelete: 'cascade' });
    this.User.hasMany(this.Category, { as: 'Categories', foreignKey: 'userId' });

    var loadFixturesData = _.bind(function(models) {
        var promises = [];

        _.each(models, function(model) {
            try {
                promises.push(require(path.join(__dirname, 'fixtures', model.charAt(0).toLowerCase() + model.slice(1)))(this, app.get('config')));
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    return;
                }
                app.get('log').error(e.stack);
            }
        }, this);

        return promises;
    }, this);

    this.syncAll = _.bind(function() {
        this.sequelize.queryInterface.dropAllTables()
            .success(_.bind(function() {
                this.sequelize.sync({ force: true })
                    .success(function() {
                        Q.all(loadFixturesData(['Locale'])).then(function() {
                            Q.all(loadFixturesData(_.without(models, 'Locale'))).then(function(results) {
                                var chainer = new Sequelize.Utils.QueryChainer();

                                _.each(results, function(result) {
                                    chainer.add(result);
                                });

                                chainer
                                    .run()
                                    .success(function() {
                                        app.get('log').info('database sync success');
                                    })
                                    .error(function(err) {
                                        app.get('log').error(err.stack);
                                    });
                            });
                        });
                    })
                    .error(function(err) {
                        app.get('log').error(err);
                    });
            }, this))
            .error(function(err) {
                app.get('log').error(err);
            });
    }, this);
};