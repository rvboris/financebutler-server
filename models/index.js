var Sequelize = require('sequelize'),
	path = require('path');

module.exports = function(app, isMaster) {
	var config = app.get('config')['db'][app.get('options').env];

	config.options.logging = !(config.options.logging === 'false');

	if (config.options.logging) {
		config.options.logging = function(msg) {
			app.get('log').info(msg);
		};
	}

	if (config.name !== app.get('options').database) {
		config.name = app.get('options').database;
	}

	var models = [
		'Currency',
		'Session',
		'User',
		'Provider',
		'Account',
		'Category',
		'Place',
		'Operation',
		'Plan'
	];

	this.sequelize = new Sequelize(config.name, config.username, config.password, config.options);

	Sequelize.Utils._.each(models, function(model) {
		this[model] = this.sequelize.import(path.join(__dirname, model.charAt(0).toLowerCase() + model.slice(1)));
	}, this);

	this.Account.belongsTo(this.User, { as: 'User' });
	this.User.hasMany(this.Account, { as: 'Accounts' });
	this.Account.belongsTo(this.Currency, { as: 'Currency' });
	this.Currency.hasMany(this.Account, { as: 'Accounts' });
	this.Operation.belongsTo(this.Category, { as: 'Category' });
	this.Category.hasMany(this.Operation, { as: 'Operations' });
	this.Operation.belongsTo(this.Place, { as: 'Place' });
	this.Place.hasMany(this.Operation, { as: 'Operations' });
	this.Operation.belongsTo(this.User, { as: 'User' });
	this.User.hasMany(this.Operation, { as: 'Operations' });
	this.Plan.belongsTo(this.User, { as: 'User' });
	this.User.hasMany(this.Plan, { as: 'Plans' });
	this.Plan.belongsTo(this.Category, { as: 'Category' });
	this.Category.hasMany(this.Plan, { as: 'Plans' });
	this.Provider.belongsTo(this.User, { as: 'User' });
	this.User.hasMany(this.Provider, { as: 'Providers' });

	var loadFixtures = Sequelize.Utils._.bind(function() {
		var chainer = new Sequelize.Utils.QueryChainer();

		Sequelize.Utils._.each(models, function(model) {
			try {
				chainer.add(require(path.join(__dirname, 'fixtures', model.charAt(0).toLowerCase() + model.slice(1)))(this));
			} catch (e) {
				if (e.code === 'MODULE_NOT_FOUND') {
					return;
				}

				app.get('log').error(e.stack);
			}

		}, this);

		chainer.run().error(function(err) {
			app.get('log').error(err.stack);
		});
	}, this);

	if (app.get('options').drop) {
		this.sequelize.sync({
			force: true
		}).success(function() {
			app.get('log').info('database sync success');
			loadFixtures();
		}).error(function(err) {
			app.get('log').error(err);
		});
	}
};