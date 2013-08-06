module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Account', {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		startValue: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
};