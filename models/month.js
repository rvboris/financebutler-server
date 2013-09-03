module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Month', {
        value: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        accountId: {
            type: DataTypes.INTEGER,
            references: "Account",
            referencesKey: "id"
        }
    });
};