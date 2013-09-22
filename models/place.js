module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Place', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        }
    });
};