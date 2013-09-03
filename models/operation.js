module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Operation', {
        value: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        comment: DataTypes.STRING,
        accountId: {
            type: DataTypes.INTEGER,
            references: "Account",
            referencesKey: "id"
        },
        categoryId: {
            type: DataTypes.INTEGER,
            references: "Category",
            referencesKey: "id"
        },
        placeId: {
            type: DataTypes.INTEGER,
            references: "Place",
            referencesKey: "id"
        }
    });
};