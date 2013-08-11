angular.module('controllers', ['restangular', 'ui.bootstrap.modal', 'ui.bootstrap.popover', 'ui.select2'])
	.controller('UserCtrl', ['$rootScope', '$scope', '$log', 'Restangular', function($rootScope, $scope, $log, Restangular) {
		$scope.instock = [];
		$scope.arrears = [];

		$scope.$on('accountUpdate', function(event, args) {
			_.each(args, function(val, key) {
				if (key === 'instock') {
					$scope.instock.length = 0;

					for (var CurrencyId in val) {
						$scope.instock.push({ CurrencyId: parseInt(CurrencyId), total: val[CurrencyId] });
					}
				} else if (key === 'arrears') {
					$scope.arrears.length = 0;

					for (var CurrencyId in val) {
						$scope.arrears.push({ CurrencyId: parseInt(CurrencyId), total: val[CurrencyId] });
					}
				} else if ($scope[key]) {
					$scope[key] = val;
				}
			});
    	});

    	$scope.$on('currencyUpdate', function(event, args) {
			$scope.currency = args;
    	});

		Restangular.setBaseUrl(['api', $rootScope.$apiKey].join('/'));

		Restangular
			.all('user')
			.getList()
			.then(function(user) {
				$scope.user = user;
			}, function(err) {
				if (err.status === 401) {
					$rootScope.$state.transitionTo('auth');
				} else {
					$rootScope.$state.transitionTo('error', { code: err.status });
					$log.error(err);
				}
			});
	}])
	.controller('AccountCtrl', ['$scope', '$log', 'Restangular', function($scope, $log, Restangular) {
		var baseAccounts = Restangular.all('account');
		var baseCurrency = Restangular.all('currency');

		$scope.accounts = baseAccounts.getList();
		$scope.currency = baseCurrency.getList();
		$scope.defaultCurrencyId = 0;
		$scope.addAccountDialog = false;
		$scope.newAccount = {
			name: '',
			startValue: 0,
			currency: 0
		};

		$scope.addAccountDialogOpen = function() {
			$scope.newAccount.name = '';
			$scope.newAccount.startValue = 0;
			$scope.newAccount.currency = $scope.defaultCurrencyId;
			$scope.addAccountDialog = true;
		};

		$scope.addAccountDialogClose = function() {
			$scope.addAccountDialog = false;
		};

		$scope.addAccountDialogSave = function() {
			$scope.addAccountDialogClose();

			$scope.currency.then(function(currency) {
				baseAccounts.post({
					name: $scope.newAccount.name,
					startValue: $scope.newAccount.startValue,
					currency: currency[$scope.newAccount.currency].id
				}).then(function(accounts) {
					$scope.accounts = baseAccounts.getList();
				});
			});
		};

		$scope.$watch('currency', function(currency) {
			_.each(currency, function(cur, idx) {
				if (cur.titleShort === 'RUB') {
					$scope.defaultCurrencyId = idx;
				}
			});

			$scope.$emit('currency', currency);
		});

		$scope.$watch('accounts', function(accounts) {
			var instock = {};
			var arrears = {};

			_.each(accounts, function(account) {
				if (account.currentValue < 0) {
					if (!arrears[account.CurrencyId]) {
						arrears[account.CurrencyId] = 0;
					}
					arrears[account.CurrencyId] += parseFloat(account.currentValue);
				} else {
					if (!instock[account.CurrencyId]) {
						instock[account.CurrencyId] = 0;
					}
					instock[account.CurrencyId] += parseFloat(account.currentValue);
				}
			});

			$scope.$emit('account', { accounts: accounts, instock: instock, arrears: arrears });
		});
	}])
	.controller('OperationsCtrl', ['$scope', 'Restangular', function($scope, Restangular) {
		$scope.$on('accountUpdate', function(event, args) {
			_.each(args, function(val, key) {
				if (key === 'accounts') {
					$scope[key] = val;
				}
			});
    	});
	}])
	.controller('ErrorCtrl', ['$scope', '$state', function($scope, $state) {
		$scope.errorCode = $state.params.code;
	}]);