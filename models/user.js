module.exports = function(sequelize, DataTypes) {
    return sequelize.define('User', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        picture: {
            type: DataTypes.STRING,
            allowNull: true
        },
        apiKey: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });
};