module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Place', {
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
};