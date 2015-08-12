angular.module('httpInterceptor',['ngResource'])

.config(['$httpProvider', function ($httpProvider) {
	$httpProvider.interceptors.push(['$q','$injector', function ($q, $injector) {
		return {
			request: function (config) {
				$injector.get('$ionicLoading').show({
					template: '<i class="ion-loading-c"></i> Please Wait...'
				});
				return $q.when(config);
			},
			response: function (response) {
				var $http = $injector.get('$http');
				if ($http.pendingRequests.length < 1) {
					$injector.get('$ionicLoading').hide();
				}
				return $q.when(response);
			},
			responseError: function (response) {
				$injector.get('$ionicLoading').hide();
				return $q.reject(response);
			},
			requestError: function (response) {
				$injector.get('$ionicLoading').hide();
				return $q.reject(response);
			}

		};
	}]);
}]);