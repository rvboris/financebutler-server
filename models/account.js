module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Account', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        startValue: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        currentValue: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            references: "User",
            referencesKey: "id"
        },
        currencyId: {
            type: DataTypes.INTEGER,
            references: "Currency",
            referencesKey: "id"
        }
    });
};