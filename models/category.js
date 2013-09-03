module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: DataTypes.ENUM('out', 'in'),
        locale: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            references: "User",
            referencesKey: "id"
        },
        parentId: {
            type: DataTypes.INTEGER
        }
    });
};