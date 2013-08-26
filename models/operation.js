module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Operation', {
		type: DataTypes.ENUM('outgo', 'income'),
		value: {
			type: DataTypes.DECIMAL,
			allowNull: false
		},
		comment: DataTypes.STRING
	});
};