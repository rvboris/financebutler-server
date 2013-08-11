angular.module('directives', [])
	.directive('smartFloat', function() {
		var currencyRegexp = /^[-]?(0|[1-9][0-9]*)((\.|,)[0-9]+)?([eE][+-]?[0-9]+)?$/;

		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				ctrl.$parsers.unshift(function(viewValue) {
					if (currencyRegexp.test(viewValue)) {
						ctrl.$setValidity('float', true);
						return parseFloat(viewValue.replace(',', '.'));
					} else {
						ctrl.$setValidity('float', false);
						return undefined;
					}
				});
			}
		};
	});