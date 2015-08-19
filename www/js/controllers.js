var GenesisControllers = angular.module('GenesisApp.controllers', []);

//Menu controller
GenesisControllers.controller('AppCtrl', function($scope, $ionicPopup, $state, $rootScope) {
	$scope.userDetails = JSON.parse(localStorage.getItem('userDetails'));
	$scope.logout = function(){
		console.log('Calling log out');
		$ionicPopup.confirm({
			title: 'Confirm',
			template: 'Are you sure want to logout?',
			cancelText: 'No', 
			okText: 'Yes'
		}).then(function(res){
			if(res){
				$rootScope.clearLocalStorage();
				$state.go('login');
			}
		});
	}
})
