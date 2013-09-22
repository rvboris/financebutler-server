module.exports = function(sequelize, DataTypes) {
    return sequelize.define('LocaleCurrency', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};