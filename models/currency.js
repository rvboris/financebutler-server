module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Currency', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};