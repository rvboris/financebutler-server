module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Operation', {
		type: DataTypes.ENUM('outgo', 'income', 'transfer'),
		value: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
};