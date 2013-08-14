'use strict';

angular.module('financeButlerApp', ['controllers', 'filters', 'directives', 'ui.state'])
	.config(function($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise('/').when('/home', '/');

		$stateProvider
			.state('parent', {
				url: '/',
				templateUrl: 'views/parent.html',
				abstract: true
			})
			.state('auth', {
				url: '/auth',
				templateUrl: 'views/auth.html',
			})
			.state('error', {
				url: '/error/:code',
				templateUrl: 'views/error.html',
				controller: 'ErrorCtrl'
			})
			.state('parent.operations', {
				url: '',
				templateUrl: 'views/operations.html',
			})
			.state('parent.plan', {
				url: 'plan',
				templateUrl: 'views/plan.html',
			})
			.state('parent.reports', {
				url: 'reports',
				templateUrl: 'views/reports.html',
			})
			.state('parent.categories', {
				url: 'categories',
				templateUrl: 'views/categories.html',
			})
			.state('parent.places', {
				url: 'places',
				templateUrl: 'views/places.html',
			});
	})
	.run(['$rootScope', '$state', 'Restangular', function($rootScope, $state, Restangular) {
		$rootScope.$state = $state;
		$rootScope.$apiKey = window.apiKey || false;

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			if (toState.name !== 'auth' && !$rootScope.$apiKey) {
				event.preventDefault();
				$rootScope.$state.transitionTo('auth');
			}
		});

		$rootScope.$on('account', function(event, args) {
        	$rootScope.$broadcast('accountUpdate', args);
    	});

    	$rootScope.$on('currency', function(event, args) {
        	$rootScope.$broadcast('currencyUpdate', args);
    	});
	}]);