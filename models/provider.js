module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Provider', {
		providerId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		provider: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
};