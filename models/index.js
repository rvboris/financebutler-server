var Sequelize = require('sequelize'),
    path = require('path');

module.exports = function (app) {
    var config = app.get('config').db[app.get('options').database || app.get('options').env];

    config.options.logging = config.options.logging === 'true';

    if (config.options.logging) {
        config.options.logging = function (msg) {
            app.get('log').info(msg);
        };
    }

    var models = [
        'User',
        'Provider',
        'Currency',
        'Session',
        'Account',
        'Category',
        'Place',
        'Operation',
        'Month',
        'Plan'
    ];

    this.sequelize = new Sequelize(config.name, config.username, config.password, config.options);

    Sequelize.Utils._.each(models, function (model) {
        this[model] = this.sequelize.import(path.join(__dirname, model.charAt(0).toLowerCase() + model.slice(1)));
    }, this);

    this.Account.belongsTo(this.User, { as: 'User', foreignKey : 'userId', foreignKeyConstraint: true });
    this.User.hasMany(this.Account, { as: 'Accounts', foreignKey : 'userId', onDelete: 'cascade', foreignKeyConstraint: true });

    this.Account.belongsTo(this.Currency, { as: 'Currency', foreignKey : 'currencyId', foreignKeyConstraint: true });
    this.Currency.hasMany(this.Account, { as: 'Accounts', foreignKey : 'currencyId', foreignKeyConstraint: true });

    this.Operation.belongsTo(this.Category, { as: 'Category', foreignKey : 'categoryId', foreignKeyConstraint: true });
    this.Category.hasMany(this.Operation, { as: 'Operations', foreignKey : 'categoryId', foreignKeyConstraint: true });

    this.Operation.belongsTo(this.Place, { as: 'Place', foreignKey : 'placeId', foreignKeyConstraint: true });
    this.Place.hasMany(this.Operation, { as: 'Operations', foreignKey : 'placeId', foreignKeyConstraint: true });

    this.Operation.belongsTo(this.Account, { as: 'Account', foreignKey : 'accountId', foreignKeyConstraint: true });
    this.Account.hasMany(this.Operation, { as: 'Operations', foreignKey : 'accountId', foreignKeyConstraint: true });

    this.Plan.belongsTo(this.Account, { as: 'Account', foreignKey : 'accountId', foreignKeyConstraint: true });
    this.Account.hasMany(this.Plan, { as: 'Plans', foreignKey : 'accountId', foreignKeyConstraint: true });

    this.Plan.belongsTo(this.Category, { as: 'Category', foreignKey : 'categoryId', foreignKeyConstraint: true });
    this.Category.hasMany(this.Plan, { as: 'Plans', foreignKey : 'categoryId', foreignKeyConstraint: true });

    this.Provider.belongsTo(this.User, { as: 'User', foreignKey : 'userId', foreignKeyConstraint: true });
    this.User.hasMany(this.Provider, { as: 'Providers', foreignKey : 'userId', foreignKeyConstraint: true });

    this.Month.belongsTo(this.Account, { as: 'Account', foreignKey : 'accountId', foreignKeyConstraint: true });
    this.Account.hasMany(this.Month, { as: 'Months', foreignKey : 'accountId', foreignKeyConstraint: true });

    this.Category.hasMany(this.Category, { as: 'Childrens', foreignKey: 'parentId', useJunctionTable: false });

    var loadFixtures = Sequelize.Utils._.bind(function () {
        var chainer = new Sequelize.Utils.QueryChainer();

        Sequelize.Utils._.each(models, function (model) {
            try {
                chainer.add(require(path.join(__dirname, 'fixtures', model.charAt(0).toLowerCase() + model.slice(1)))(this, app.get('config')));
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    return;
                }
                app.get('log').error(e.stack);
            }
        }, this);

        chainer.run().error(function (err) {
            app.get('log').error(err.stack);
        });
    }, this);

    this.syncAll = Sequelize.Utils._.bind(function() {
        this.sequelize.queryInterface.dropAllTables()
            .success(Sequelize.Utils._.bind(function() {
                this.sequelize.sync({ force: true })
                    .success(function() {
                        app.get('log').info('database sync success');
                        loadFixtures();
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