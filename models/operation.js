module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Operation', {
        value: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        comment: DataTypes.STRING
    });
};