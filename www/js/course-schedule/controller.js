GenesisControllers.controller('CoursesScheduleCtrl', function($scope, API_URL, NetworkService, $ionicPopup, $state,  $ionicModal, $filter) {
	$scope.courses = [];
	$scope.otherDetails = {};
	$scope.courseDetails = [];
	
	var getCourses = function(){
		var userParams = {
				'session': localStorage.getItem('sessionId'),
				'module_name': "Contacts",
				'module_id': localStorage.getItem('userContactId'),
				'link_field_name' : 'contacts_gi_line_items_1',
				'related_module_query' : "status_c IN ('Suspended', 'Active', 'Complete')",
				'related_fields': ['id','gi_products_gi_line_items_1_name'],
				'related_module_link_name_to_fields_array':[{
					'name':'gi_products_gi_line_items_1',
					'value':['id','name','type','provisional_c']
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
			angular.forEach(data.relationship_list, function(course, index){
				if(course[0].records[0].type.value == 'Service'){
					$scope.courses.push(course[0].records[0]);	
					localStorage.setItem('mycourses', JSON.stringify($scope.courses));
					getCourseOtherDetails(course[0].records[0].id.value, course[0].records[0].provisional_c.value);
					if(course[0].records[0].provisional_c.value != 1){
						fetchDetailedSchedule(course[0].records[0].id.value);
					}
					
					var lastUpdated = {};
					lastUpdated.timestamp = new Date().getTime();
					lastUpdated.date = $filter('date')(new Date, 'medium');
					localStorage.setItem('lastUpdatedSchedule', JSON.stringify(lastUpdated));
					$scope.lastUpdated = lastUpdated.date;
				}
			});
		};
		options.error = function(error){
			$ionicPopup.alert({
				title: 'Error',
				template: 'There is some problem. Please try again.'
			});
		};

		NetworkService.POST(options);
	};
	
	var getCourseOtherDetails = function(courseId, provisionalValue){
		var userParams = {
				'session': localStorage.getItem('sessionId'),
				'module_name': "GI_Products",
				'ids': [courseId],
				'related_fields': ['id','name','date_start_c','date_end_c','number_of_sessions_c']
		};

		var dataToPost = {
				method: "get_entries", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(userParams)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = function(data){
			var details = data.entry_list[0].name_value_list;
			details.date_start_c.value = $filter('date')(details.date_start_c.value, 'mediumDate');
			details.date_end_c.value = $filter('date')(details.date_end_c.value, 'mediumDate');
			
			var localDetails = JSON.parse(localStorage.getItem('mycoursesDetails'));
			if(localDetails){
				localDetails.push(details);
				localStorage.setItem('mycoursesDetails',JSON.stringify(localDetails));
			}else{
				var temp = [];
				temp.push(details);
				localStorage.setItem('mycoursesDetails',JSON.stringify(temp));
			}
			
		};
		options.error = function(error){
			$ionicPopup.alert({
				title: 'Error',
				template: 'There is some problem. Please try again.'
			});
		};

		NetworkService.POST(options);
	};

	var fetchDetailedSchedule = function(courseId){
		var userParams = {
				'session': localStorage.getItem('sessionId'),
				'module_name': "GI_Products",
				'module_id': courseId,
				'link_field_name' : 'gi_products_meetings_1',
				'related_module_query' : "",
				'related_fields': ['id','name','date_start','date_end','duration_hours','duration_minutes','location'],
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
			var courseDetails = [];
			var sessionDetails = [];
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
				courseDetails.push(entry.name_value_list);
			});

			courseDetails = $filter('orderBy')(courseDetails,'date_start.value');
			var sequence_no = 0;
			var groupByDate = '';
			angular.forEach(courseDetails, function(entry, index){
				if(groupByDate && groupByDate == entry.dateStart){
					entry.sequence_no = sequence_no;
				}else{
					entry.sequence_no = ++sequence_no;
					groupByDate = entry.dateStart;
				}
				sessionDetails.push(entry);
			});
			
			var courseMap = {};
			courseMap.id = courseId;
			courseMap.value = sessionDetails;
			
			var localDetails = JSON.parse(localStorage.getItem('mycoursesSessions'));
			if(localDetails){
				localDetails.push(courseMap);
				localStorage.setItem('mycoursesSessions',JSON.stringify(localDetails));
			}else{
				var temp = [];
				temp.push(courseMap);
				localStorage.setItem('mycoursesSessions',JSON.stringify(temp));
			}

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

	this.downloadSchedule = function(productId){
		var url = "http://www.genesisreview.com/crm1/index.php?entryPoint=downloadScheduleEntryPoint&product_id="+productId;
		window.open(url, "_system");
	};

	this.openDetailModal = function(courseId, courseDescr, provisionalValue){
		$scope.seletedCourse = courseDescr;
		$ionicModal.fromTemplateUrl('courses-details.html', {
			scope: $scope,
			animation: 'slide-in-right'
		}).then(function(modal) {
			$scope.modal = modal;
			var courseDetails = JSON.parse(localStorage.getItem('mycoursesDetails'));
			angular.forEach(courseDetails, function(course, key){
				if(course.id.value == courseId){
					$scope.otherDetails = course;
				}
			});
			if(provisionalValue != 1){
				var sessions = JSON.parse(localStorage.getItem('mycoursesSessions'));
				angular.forEach(sessions, function(session, key){
					if(session.id == courseId){
						$scope.courseDetails = session.value;
					}
				});
			}
			$scope.modal.show();
		});
	};

	$scope.closeDetailModal = function(){
		$scope.courseDetails = [];
		$scope.modal.hide();
	};

	$scope.$on('$destroy', function() {
		if($scope.modal){
			$scope.modal.remove();
		}
	});
	
	this.refresh = function(){
		$scope.courses = [];
		$scope.otherDetails = {};
		$scope.courseDetails = [];
		getCourses();
	}
	
	var last_update = JSON.parse(localStorage.getItem('lastUpdatedSchedule'));
	if(last_update && new Date().getTime() - last_update.timestamp > 12 * 60 * 60 * 1000){
		getCourses();
	}else{
		var savedCourses = JSON.parse(localStorage.getItem('mycourses'));
		if(savedCourses){
			console.log('My Courses: Courses found locally. Fetching data.');
			$scope.courses = savedCourses;
			$scope.lastUpdated = JSON.parse(localStorage.getItem('lastUpdatedSchedule')).date;
		}else{
			getCourses();
		}
	}
});