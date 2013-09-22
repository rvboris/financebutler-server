module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Currency', {
        code: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};