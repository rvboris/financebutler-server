module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Currency', {
		title: {
			type: DataTypes.STRING,
			allowNull: false
		},
		titleShort: {
			type: DataTypes.STRING,
			allowNull: false
		},
		symbol: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
};