module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Plan', {
        value: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        comment: DataTypes.STRING
    });
};