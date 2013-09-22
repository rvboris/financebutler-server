module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: DataTypes.ENUM('out', 'in')
    });
};