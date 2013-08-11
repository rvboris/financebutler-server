angular.module('filters', [])
	.filter('stateClass', function() {
		return function(input) {
			return input.replace('.', '-');
		};
	})
	.filter('currencyTitleShortById', function() {
		return function(currencyId, currencyList) {
			if (!currencyList || !currencyId) {
				return '';
			}

			return _.find(currencyList, function(currency) {
				return currency.id === currencyId;
			}).titleShort;
		};
	})
	.filter('accounting', ['$filter', function($filter) {
		return function(number, currencyId, currencyList) {
			return accounting.formatMoney(number, $filter('currencyTitleShortById')(currencyId, currencyList), 2, ' ', ',', '%v %s');
		};
	}]);