module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Plan', {
		type: DataTypes.ENUM('outgo', 'income'),
		value: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
};