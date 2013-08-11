var fs = require('fs'),
	path = require('path');

module.exports = function(models) {
	return models.Currency.bulkCreate(JSON.parse(fs.readFileSync(path.join(__dirname, 'currency.json'))));
};