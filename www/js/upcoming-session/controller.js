GenesisControllers.controller('UpcomingSessionsCtrl', function($scope, $state, API_URL, NetworkService, $filter) {
	$scope.sessionArray = JSON.parse(localStorage.getItem('courseDetails'));
	$scope.upcomingSessions = [];
	var mycourses = [];
	var processSessions = function(){
		var currentTime = new Date().getTime();
		$scope.upcomingSessions = [];
		for (var index in $scope.sessionArray) {
			var dateStamp = new Date($scope.sessionArray[index].date_start.value).getTime();
			if(dateStamp > currentTime){
				$scope.upcomingSessions.push($scope.sessionArray[index]);
				if($scope.upcomingSessions.length == 10){
					break;
				}
			}
		}
		$scope.lastUpdated = JSON.parse(localStorage.getItem('lastUpdatedSessions')).date;
	};
	
	var fetchDetailedSchedule = function(courseId, courseName){
		var userParams = {
				'session': localStorage.getItem('sessionId'),
				'module_name': "GI_Products",
				'module_id': courseId,
				'link_field_name' : 'gi_products_meetings_1',
				'related_module_query' : "",
				'related_fields': ['id','name','date_start','date_end','duration_hours', 'duration_minutes', 'location'],
				'deleted':0,
				'order_by':' date_start ',
				'offset':0,
				'limit': 200
		};

		var dataToPost = {
				method: "get_relationships", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(userParams)
		};

		var onfetchDetailSuccess = function(data){
			angular.forEach(data.entry_list, function(entry, index){
				var dateTime = entry.name_value_list.date_start.value.split(" ");
				entry.name_value_list.dateStart = $filter('date')(dateTime[0],'mediumDate');
				entry.name_value_list.time_start = dateTime[1].slice(0,5);
				if(entry.name_value_list.duration_hours.value > 0){
					entry.name_value_list.duration = entry.name_value_list.duration_hours.value +'hr '
				}
				if(entry.name_value_list.duration_minutes.value > 0){
					entry.name_value_list.duration = (entry.name_value_list.duration?entry.name_value_list.duration:'') + entry.name_value_list.duration_minutes.value +'min'
				}
				entry.name_value_list.course_name = courseName;
				entry.name_value_list.course_id = courseId;
				$scope.sessionArray.push(entry.name_value_list);
			});

			$scope.sessionArray = $filter('orderBy')($scope.sessionArray,'date_start.value');
			localStorage.setItem('courseDetails', JSON.stringify($scope.sessionArray));
			
			var lastUpdated = {};
			lastUpdated.timestamp = new Date().getTime();
			lastUpdated.date = $filter('date')(new Date, 'medium');
			localStorage.setItem('lastUpdatedSessions', JSON.stringify(lastUpdated));

			processSessions();

		};

		var onfetchDetailFailure = function(error){
			$ionicPopup.alert({
				title: 'Error',
				template: 'There is some problem. Please try again.'
			});
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = onfetchDetailSuccess;
		options.error = onfetchDetailFailure;

		NetworkService.POST(options);
	};

	this.refreshCourses = function(){
		console.log('Refreshing courses');
		$scope.sessionArray = [];
		var userParams = {
				'session': localStorage.getItem('sessionId'),
				'module_name': "Contacts",
				'module_id': localStorage.getItem('userContactId'),
				'link_field_name' : 'contacts_gi_line_items_1',
				'related_module_query' : "status_c IN ('Suspended', 'Active', 'Complete')",
				'related_fields': ['id','gi_products_gi_line_items_1_name'],
				'related_module_link_name_to_fields_array':[{
					'name':'gi_products_gi_line_items_1',
					'value':['id','name','type', 'provisional_c']
				}],
				'deleted':0,
				'order_by':' name ',
				'offset':0,
				'limit': 200
		};

		var dataToPost = {
				method: "get_relationships", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(userParams)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = function(data){
			var counter = 0;
			angular.forEach(data.relationship_list, function(course, index){
				if(course[0].records[0].type.value == 'Service' && course[0].records[0].provisional_c.value != 1){
					mycourses.push(course[0].records[0]);
					localStorage.setItem('mycourses', JSON.stringify(mycourses));
					fetchDetailedSchedule(course[0].records[0].id.value, course[0].records[0].name.value);				
				}
			});
		};
		options.error = function(){
			//error
			console.log('Call failed for fetching courses for upcoming sessions');
		};

		NetworkService.POST(options);
	};
	
	if(new Date().getTime() - JSON.parse(localStorage.getItem('lastUpdatedSessions')).timestamp > 12*60*60*1000){
		this.refreshCourses();
	}else{
		processSessions();
	}
});
