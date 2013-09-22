module.exports = function(sequelize, DataTypes) {
    return sequelize.define('LocaleCategoryDefault', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};