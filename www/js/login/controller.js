GenesisControllers.controller('LoginCtrl', function($scope, $state, API_URL, NetworkService, md5, $ionicPopup, SessionService, UserDetails) {
	$scope.user = {};
	if(!localStorage.getItem('sessionId')){
		SessionService.getSession();
	}

	/*$scope.goToSignUp = function(){
		$state.go('signup');
	};*/

	this.goToForgotPassword = function(){
		$state.go('forgot-password');
	};

	$scope.user.email = "dareen.najee@gmail.com";
	$scope.user.password = "@tzRHtN1";

	this.doLogIn = function(){
		var userParams = {
				session:localStorage.getItem('sessionId'),
				module_name: "Contacts",
				query: " username_c='"+$scope.user.email+"' AND password_c='"+$scope.user.password+"' ",
				order_by:'',
				offset:'0',
				max_results:'2',
				deleted:'0',
				Favorites: false
		};
		var dataToPost = {
				method: "get_entry_list", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(userParams)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = $scope.onLoginSuccess;
		options.error = $scope.onLoginFailure;

		NetworkService.POST(options);
	};

	var getUserDetails =  function(){
		var params = {
				"session": localStorage.getItem('sessionId'),
				"module_name": "Contacts",
				"ids": [localStorage.getItem('userContactId')]
		};
		var dataToPost = {
				method: "get_entries", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(params)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = function(data){
			console.log('User details fetch successfully');
			localStorage.setItem('userDetails', JSON.stringify(data.entry_list[0]));
			$state.go('app.home');
		};
		options.error = function(error){
			//error
		};

		console.log('Fetching user data');
		NetworkService.POST(options);
	};

	$scope.onLoginSuccess = function(result){
		if(result.entry_list[0].id) {
			localStorage.setItem('userContactId',result.entry_list[0].id);
			getUserDetails();
		}else{
			$ionicPopup.alert({
				title: 'Error',
				template: 'Invalid login. Please try again.'
			});
		}
	};

	$scope.onLoginFailure = function(error){
		$ionicPopup.alert({
			title: 'Error',
			template: 'There is some problem. Please try again.'
		});
	};

	// We need this for the form validation
	$scope.selected_tab = "";

	$scope.$on('my-tabs-changed', function (event, data) {
		$scope.selected_tab = data.title;
	});

})