module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Locale', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};