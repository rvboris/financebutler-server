var _ = require('lodash');

module.exports = {
    categoryFlatToTree: function(categories) {
        var flat = {}, root = [], parentIdx;

        _.each(categories, function(category) {
            category.children = [];
            flat['id' + category.id] = category;
        });

        _.forIn(flat, function(val, key) {
            parentIdx = 'id' + flat[key].parentId;

            if (!flat[parentIdx]) {
                return;
            }

            flat[parentIdx].children.push(flat[key]);
        });

        _.forIn(flat, function(val, key) {
            parentIdx = 'id' + flat[key].parentId;

            if (flat[parentIdx]) {
                return;
            }

            root.push(flat[key]);
        });

        return root;
    },
    categoryChildrens: function(categories, rootId) {
        var childs = [];

        var findCategoriesByParentId = function(parentId) {
            return _.filter(categories, function(category) {
                return category.parentId === parentId;
            });
        };

        var iterate = function(parentId) {
            _.each(findCategoriesByParentId(parentId), function(category) {
                childs.push(category);
                iterate(category.id);
            });
        };

        iterate(rootId);

        return childs;
    }
};