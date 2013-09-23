module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        type: DataTypes.ENUM('any', 'out', 'in')
    });
};