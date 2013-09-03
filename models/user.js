module.exports = function (sequelize, DataTypes) {
    return sequelize.define('User', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apiKey: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};