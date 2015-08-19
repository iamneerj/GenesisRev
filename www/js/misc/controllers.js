angular.module('GenesisApp.controllers', [])


//WALKTHROUGH
.controller('WalkthroughCtrl', function($scope, $state) {
	$scope.goToLogIn = function(){
		$state.go('login');
	};

	$scope.goToSignUp = function(){
		$state.go('signup');
	};
})

.controller('UpcomingSessionsCtrl', function($scope, $state, API_URL, NetworkService, $filter) {
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
		$scope.lastUpdated = JSON.parse(localStorage.getItem('lastUpdated')).date;
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
			localStorage.setItem('lastUpdated', JSON.stringify(lastUpdated));

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
	
	if(new Date().getTime() - JSON.parse(localStorage.getItem('lastUpdated')).timestamp > 12*60*60*1000){
		this.refreshCourses();
	}else{
		processSessions();
	}
})

.controller('LoginCtrl', function($scope, $state, API_URL, NetworkService, md5, $ionicPopup, SessionService, UserDetails) {
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

.controller('SignupCtrl', function($scope, $state) {
	$scope.user = {};

	$scope.user.email = "john@doe.com";

	$scope.doSignUp = function(){
		$state.go('app.feeds-categories');
	};

	$scope.goToLogIn = function(){
		$state.go('login');
	};
})

.controller('ForgotPasswordCtrl', function($scope, $state) {
	$scope.recoverPassword = function(){
		$state.go('app.feeds-categories');
	};

	$scope.goToLogIn = function(){
		$state.go('login');
	};

	$scope.goToSignUp = function(){
		$state.go('signup');
	};

	$scope.user = {};
})

//MISCELLANEOUS
.controller('MiscellaneousCtrl', function($scope) {

})

.controller('HomeCtrl', function($scope, PushLinkContact, API_URL, NetworkService, $filter) {
	$scope.courses = [];
	var mycourses = [];
	$scope.upcomingSession = [];
	if(window.cordova){
		PushLinkContact.setRelationship();
	}
	var getNotification = function(){
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
	};

	var processSession = function(){
		var currentTime = new Date().getTime();
		$scope.upcomingSession = [];
		for (var index in $scope.courses) {
			var dateStamp = new Date($scope.courses[index].date_start.value).getTime();
			if(dateStamp > currentTime){
				$scope.upcomingSession.push($scope.courses[index]);
				if($scope.upcomingSession.length == 3){
					break;
				}
			}
		}
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
				$scope.courses.push(entry.name_value_list);
			});

			$scope.courses = $filter('orderBy')($scope.courses,'date_start.value');
			localStorage.setItem('courseDetails', JSON.stringify($scope.courses));
			
			var lastUpdated = {};
			lastUpdated.timestamp = new Date().getTime();
			lastUpdated.date = $filter('date')(new Date, 'medium');
			localStorage.setItem('lastUpdated', JSON.stringify(lastUpdated));

			processSession();

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

	var getCourses = function(){
		var courses = [];
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
	}

	getNotification();
	var last_update = JSON.parse(localStorage.getItem('lastUpdated'));
	if(last_update && new Date().getTime() - last_update.timestamp > 12 * 60 * 60 * 1000){
		getCourses();
	}else{
		var savedCourses = JSON.parse(localStorage.getItem('courseDetails'));
		if(savedCourses){
			console.log('Courses found locally. Fetching data.');
			$scope.courses = savedCourses;
			processSession();
		}else{
			getCourses();
		}
	}

})

.controller('LatestMessageCtrl', function($scope, API_URL, NetworkService) {
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
})

.controller('RateApp', function($scope) {
	$scope.rateApp = function(){
		if(ionic.Platform.isIOS()){
			//you need to set your own ios app id
			AppRate.preferences.storeAppURL.ios = '1234555553>';
			AppRate.promptForRating(true);
		}else if(ionic.Platform.isAndroid()){
			//you need to set your own android app id
			AppRate.preferences.storeAppURL.android = 'market://details?id=ionFB';
			AppRate.promptForRating(true);
		}
	};
})

.controller('CoursesScheduleCtrl', function($scope, $q, API_URL, NetworkService, $ionicPopup, $state,  $ionicModal, $filter) {
	$scope.courses = [];
	$scope.otherDetails = {};
	
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
	}
	

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
			$scope.otherDetails = data.entry_list[0].name_value_list;
			$scope.otherDetails.date_start_c.value = $filter('date')($scope.otherDetails.date_start_c.value, 'mediumDate');
			$scope.otherDetails.date_end_c.value = $filter('date')($scope.otherDetails.date_end_c.value, 'mediumDate');
			localStorage.setItem(JSON.stringigfy($scope.otherDetails));
			if(provisionalValue == 1){
				$scope.modal.show();
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
			$scope.courseDetails = [];
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
				$scope.courseDetails.push(entry);
			});
			$scope.modal.show();
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
			getCourseOtherDetails(courseId, provisionalValue);
			if(provisionalValue != 1){
				fetchDetailedSchedule(courseId);
			}
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
	
	var last_update = JSON.parse(localStorage.getItem('lastUpdated'));
	if(last_update && new Date().getTime() - last_update.timestamp > 12 * 60 * 60 * 1000){
		getCourses();
	}else{
		var savedCourses = JSON.parse(localStorage.getItem('mycourses'));
		if(savedCourses){
			console.log('My Courses: Courses found locally. Fetching data.');
			$scope.courses = savedCourses;
		}else{
			getCourses();
		}
	}
})

.controller('SendMailCtrl', function($scope) {
	$scope.sendMail = function(){
		cordova.plugins.email.isAvailable(
				function (isAvailable) {
					// alert('Service is not available') unless isAvailable;
					cordova.plugins.email.open({
						to:      'envato@startapplabs.com',
						cc:      'hello@startapplabs.com',
						// bcc:     ['john@doe.com', 'jane@doe.com'],
						subject: 'Greetings',
						body:    'How are you? Nice greetings from IonFullApp'
					});
				}
		);
	};
})

.controller('MapsCtrl', function($scope, $ionicLoading) {

	$scope.info_position = {
			lat: 43.07493,
			lng: -89.381388
	};

	$scope.center_position = {
			lat: 43.07493,
			lng: -89.381388
	};

	$scope.my_location = "";

	$scope.$on('mapInitialized', function(event, map) {
		$scope.map = map;
	});

	$scope.centerOnMe= function(){
		$scope.positions = [];

		$ionicLoading.show({
			template: 'Loading...'
		});

		// with this function you can get the user’s current position
		// we use this plugin: https://github.com/apache/cordova-plugin-geolocation/
		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			$scope.current_position = {lat: pos.k,lng: pos.D};
			$scope.my_location = pos.k+", "+pos.D;
			$scope.map.setCenter(pos);
			$ionicLoading.hide();
		});
	};
})

.controller('AdsCtrl', function($scope, $ionicActionSheet, AdMob, iAd) {

	$scope.manageAdMob = function() {

		// Show the action sheet
		var hideSheet = $ionicActionSheet.show({
			//Here you can add some more buttons
			buttons: [
			          { text: 'Show Banner' },
			          { text: 'Show Interstitial' }
			          ],
			          destructiveText: 'Remove Ads',
			          titleText: 'Choose the ad to show',
			          cancelText: 'Cancel',
			          cancel: function() {
			        	  // add cancel code..
			          },
			          destructiveButtonClicked: function() {
			        	  console.log("removing ads");
			        	  AdMob.removeAds();
			        	  return true;
			          },
			          buttonClicked: function(index, button) {
			        	  if(button.text == 'Show Banner')
			        	  {
			        		  console.log("show banner");
			        		  AdMob.showBanner();
			        	  }

			        	  if(button.text == 'Show Interstitial')
			        	  {
			        		  console.log("show interstitial");
			        		  AdMob.showInterstitial();
			        	  }

			        	  return true;
			          }
		});
	};

	$scope.manageiAd = function() {

		// Show the action sheet
		var hideSheet = $ionicActionSheet.show({
			//Here you can add some more buttons
			buttons: [
			          { text: 'Show iAd Banner' },
			          { text: 'Show iAd Interstitial' }
			          ],
			          destructiveText: 'Remove Ads',
			          titleText: 'Choose the ad to show - Interstitial only works in iPad',
			          cancelText: 'Cancel',
			          cancel: function() {
			        	  // add cancel code..
			          },
			          destructiveButtonClicked: function() {
			        	  console.log("removing ads");
			        	  iAd.removeAds();
			        	  return true;
			          },
			          buttonClicked: function(index, button) {
			        	  if(button.text == 'Show iAd Banner')
			        	  {
			        		  console.log("show iAd banner");
			        		  iAd.showBanner();
			        	  }
			        	  if(button.text == 'Show iAd Interstitial')
			        	  {
			        		  console.log("show iAd interstitial");
			        		  iAd.showInterstitial();
			        	  }
			        	  return true;
			          }
		});
	};
})

.controller('InAppBrowserCtrl', function($scope) {
	$scope.openBrowser = function(){
		window.open('http://www.google.com', '_blank', 'location=yes');
	};
})

//FEED
//brings all feed categories
.controller('FeedsCategoriesCtrl', function($scope, $http) {
	$scope.feeds_categories = [];

	$http.get('feeds-categories.json').success(function(response) {
		$scope.feeds_categories = response;
	});
})

//bring specific category providers
.controller('CategoryFeedsCtrl', function($scope, $http, $stateParams) {
	$scope.category_sources = [];

	$scope.categoryId = $stateParams.categoryId;

	$http.get('feeds-categories.json').success(function(response) {
		var category = _.find(response, {id: $scope.categoryId});
		$scope.categoryTitle = category.title;
		$scope.category_sources = category.feed_sources;
	});
})

//this method brings posts for a source provider
.controller('FeedEntriesCtrl', function($scope, $stateParams, $http, FeedList, $q, $ionicLoading, BookMarkService) {
	$scope.feed = [];

	var categoryId = $stateParams.categoryId,
	sourceId = $stateParams.sourceId;

	$scope.doRefresh = function() {

		$http.get('feeds-categories.json').success(function(response) {

			$ionicLoading.show({
				template: 'Loading entries...'
			});

			var category = _.find(response, {id: categoryId }),
			source = _.find(category.feed_sources, {id: sourceId });

			$scope.sourceTitle = source.title;

			FeedList.get(source.url)
			.then(function (result) {
				$scope.feed = result.feed;
				$ionicLoading.hide();
				$scope.$broadcast('scroll.refreshComplete');
			}, function (reason) {
				$ionicLoading.hide();
				$scope.$broadcast('scroll.refreshComplete');
			});
		});
	};

	$scope.doRefresh();

	$scope.readMore = function(link){
		window.open(link, '_blank', 'location=yes');
	};

	$scope.bookmarkPost = function(post){
		$ionicLoading.show({ template: 'Post Saved!', noBackdrop: true, duration: 1000 });
		BookMarkService.bookmarkFeedPost(post);
	};
})


//Multimedia
.controller('MultimediaCtrl', function($scope) {

})

//SETTINGS
.controller('SettingsCtrl', function($scope, $ionicActionSheet, $state) {
	$scope.airplaneMode = true;
	$scope.wifi = false;
	$scope.bluetooth = true;
	$scope.personalHotspot = true;

	$scope.checkOpt1 = true;
	$scope.checkOpt2 = true;
	$scope.checkOpt3 = false;

	$scope.radioChoice = 'B';

	// Triggered on a the logOut button click
	$scope.showLogOutMenu = function() {

		// Show the action sheet
		var hideSheet = $ionicActionSheet.show({
			//Here you can add some more buttons
			// buttons: [
			// { text: '<b>Share</b> This' },
			// { text: 'Move' }
			// ],
			destructiveText: 'Logout',
			titleText: 'Are you sure you want to logout? This app is awsome so I recommend you to stay.',
			cancelText: 'Cancel',
			cancel: function() {
				// add cancel code..
			},
			buttonClicked: function(index) {
				//Called when one of the non-destructive buttons is clicked,
				//with the index of the button that was clicked and the button object.
				//Return true to close the action sheet, or false to keep it opened.
				return true;
			},
			destructiveButtonClicked: function(){
				//Called when the destructive button is clicked.
				//Return true to close the action sheet, or false to keep it opened.
				$state.go('login');
			}
		});

	};
})

//FORMS
.controller('FormsCtrl', function($scope) {

})

//PROFILE
.controller('ProfileCtrl', function($scope) {

})

//TINDER CARDS
.controller('TinderCardsCtrl', function($scope, $http) {

	$scope.cards = [];


	$scope.addCard = function(img, name) {
		var newCard = {image: img, name: name};
		newCard.id = Math.random();
		$scope.cards.unshift(angular.extend({}, newCard));
	};

	$scope.addCards = function(count) {
		$http.get('http://api.randomuser.me/?results=' + count).then(function(value) {
			angular.forEach(value.data.results, function (v) {
				$scope.addCard(v.user.picture.large, v.user.name.first + " " + v.user.name.last);
			});
		});
	};

	$scope.addFirstCards = function() {
		$scope.addCard("https://dl.dropboxusercontent.com/u/30675090/envato/tinder-cards/left.png","Nope");
		$scope.addCard("https://dl.dropboxusercontent.com/u/30675090/envato/tinder-cards/right.png", "Yes");
	};

	$scope.addFirstCards();
	$scope.addCards(5);

	$scope.cardDestroyed = function(index) {
		$scope.cards.splice(index, 1);
		$scope.addCards(1);
	};

	$scope.transitionOut = function(card) {
		console.log('card transition out');
	};

	$scope.transitionRight = function(card) {
		console.log('card removed to the right');
		console.log(card);
	};

	$scope.transitionLeft = function(card) {
		console.log('card removed to the left');
		console.log(card);
	};
})


//BOOKMARKS
.controller('BookMarksCtrl', function($scope, $rootScope, BookMarkService, $state) {

	$scope.bookmarks = BookMarkService.getBookmarks();

	// When a new post is bookmarked, we should update bookmarks list
	$rootScope.$on("new-bookmark", function(event){
		$scope.bookmarks = BookMarkService.getBookmarks();
	});

	$scope.goToFeedPost = function(link){
		window.open(link, '_blank', 'location=yes');
	};
	$scope.goToWordpressPost = function(postId){
		$state.go('app.post', {postId: postId});
	};
})

//SLIDER
.controller('SliderCtrl', function($scope, $http, $ionicSlideBoxDelegate) {

})

//WORDPRESS
.controller('WordpressCtrl', function($scope, $http, $ionicLoading, PostService, BookMarkService) {
	$scope.posts = [];
	$scope.page = 1;
	$scope.totalPages = 1;

	$scope.doRefresh = function() {
		$ionicLoading.show({
			template: 'Loading posts...'
		});

		//Always bring me the latest posts => page=1
		PostService.getRecentPosts(1)
		.then(function(data){

			$scope.totalPages = data.pages;
			$scope.posts = PostService.shortenPosts(data.posts);

			$ionicLoading.hide();
			$scope.$broadcast('scroll.refreshComplete');
		});
	};

	$scope.loadMoreData = function(){
		$scope.page += 1;

		PostService.getRecentPosts($scope.page)
		.then(function(data){
			//We will update this value in every request because new posts can be created
			$scope.totalPages = data.pages;
			var new_posts = PostService.shortenPosts(data.posts);
			$scope.posts = $scope.posts.concat(new_posts);

			$scope.$broadcast('scroll.infiniteScrollComplete');
		});
	};

	$scope.moreDataCanBeLoaded = function(){
		return $scope.totalPages > $scope.page;
	};

	$scope.bookmarkPost = function(post){
		$ionicLoading.show({ template: 'Post Saved!', noBackdrop: true, duration: 1000 });
		BookMarkService.bookmarkWordpressPost(post);
	};

	$scope.doRefresh();
})

//WORDPRESS POST
.controller('WordpressPostCtrl', function($scope, $http, $stateParams, PostService, $ionicLoading) {

	$ionicLoading.show({
		template: 'Loading post...'
	});

	var postId = $stateParams.postId;
	PostService.getPost(postId)
	.then(function(data){
		$scope.post = data.post;
		$ionicLoading.hide();
	});

	$scope.sharePost = function(link){
		window.plugins.socialsharing.share('Check this post here: ', null, null, link);
	};
})


.controller('ImagePickerCtrl', function($scope, $rootScope, $cordovaCamera) {

	$scope.images = [];

	$scope.selImages = function() {

		window.imagePicker.getPictures(
				function(results) {
					for (var i = 0; i < results.length; i++) {
						console.log('Image URI: ' + results[i]);
						$scope.images.push(results[i]);
					}
					if(!$scope.$$phase) {
						$scope.$apply();
					}
				}, function (error) {
					console.log('Error: ' + error);
				}
		);
	};

	$scope.removeImage = function(image) {
		$scope.images = _.without($scope.images, image);
	};

	$scope.shareImage = function(image) {
		window.plugins.socialsharing.share(null, null, image);
	};

	$scope.shareAll = function() {
		window.plugins.socialsharing.share(null, null, $scope.images);
	};
})


//LAYOUTS
.controller('LayoutsCtrl', function($scope) {

})

;
