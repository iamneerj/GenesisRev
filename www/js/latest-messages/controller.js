GenesisControllers.controller('LatestMessageCtrl', function($scope, API_URL, NetworkService) {
	$scope.notifications = [];
	var params = {
			"session": localStorage.getItem('sessionId'),
			"module_name": "Contacts",
			"module_id": localStorage.getItem('userContactId'),
			"link_field_name": "notes",
			"related_module_query": "parent_type = 'GI_Mobile_Messages'",
			"related_fields": ['id','name','description'],
			"deleted": 0,
			"order_by": " date_entered DESC ",
			"offset": 0,
			"limit": 5
	};
	var dataToPost = {
			method: "get_relationships", 
			input_type: "JSON", 
			response_type: "JSON",
			rest_data: JSON.stringify(params)
	};

	var options = {};
	options.url = API_URL;
	options.data = dataToPost;
	options.success = function(data){
		console.log('Get Notification sucess!!');
		$scope.notifications = data.entry_list;
	};
	options.error = function(error){
		$ionicPopup.alert({
			title: 'Error',
			template: 'There is some problem in getting notification.'
		});
	};

	NetworkService.POST(options);
});