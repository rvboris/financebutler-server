module.exports = function(sequelize, DataTypes) {
	return sequelize.define('User', {
		email: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
};