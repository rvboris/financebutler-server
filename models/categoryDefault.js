module.exports = function(sequelize, DataTypes) {
    return sequelize.define('CategoryDefault', {
        uuid: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });
};