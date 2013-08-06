var Sequelize = require('sequelize'),
	path = require('path');

module.exports = function(app, isMaster) {
	var config = app.get('config').get('db');
	var models = ['User', 'Account', 'Category', 'Place', 'Operation', 'Plan'];

	this.sequelize = new Sequelize(config.name, config.username, config.password, config.options);

	models.forEach(function(model) {
		this[model] = this.sequelize.import(__dirname + path.sep + model.toLowerCase());
	}, this);

	this.Account.belongsTo(this.User);
	this.User.hasMany(this.Account);
	this.Operation.belongsTo(this.Category);
	this.Category.hasMany(this.Operation);
	this.Operation.belongsTo(this.Place);
	this.Place.hasMany(this.Operation);
	this.Operation.belongsTo(this.User);
	this.User.hasMany(this.Operation);
	this.Plan.belongsTo(this.User);
	this.User.hasMany(this.Plan);
	this.Plan.belongsTo(this.Category);
	this.Category.hasMany(this.Plan);

	if (isMaster && app.get('program').drop) {
		this.sequelize.sync({
			force: true
		}).success(function() {
			app.get('log').info('database sync success');
		}).error(function(err) {
			app.get('log').error(err);
		});
	}
};