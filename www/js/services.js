angular.module('GenesisApp.services', [])

.service('NetworkService', function ($http, $q, $ionicPopup, $state){
	function jQueryLikeParamSerializer(params) {
		if (!params) return '';
		var parts = [];
		serialize(params, '', true);
		return parts.join('&');

		function forEachSorted(obj, iterator, context) {
			var keys = sortedKeys(obj);
			for (var i = 0; i < keys.length; i++) {
				iterator.call(context, obj[keys[i]], keys[i]);
			}
			return keys;
		}
		function sortedKeys(obj) {
			var keys = [];
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					keys.push(key);
				}
			}
			return keys.sort();
		}
		function encodeUriQuery(val, pctEncodeSpaces) {
			return encodeURIComponent(val).
			replace(/%40/gi, '@').
			replace(/%3A/gi, ':').
			replace(/%24/g, '$').
			replace(/%2C/gi, ',').
			replace(/%3B/gi, ';').
			replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
		}
		function serializeValue(v) {
			if (angular.isObject(v)) {
				return angular.isDate(v) ? v.toISOString() : angular.toJson(v);
			}
			return v;
		}
		function serialize(toSerialize, prefix, topLevel) {
			if (toSerialize === null || angular.isUndefined(toSerialize)) return;
			if (angular.isArray(toSerialize)) {
				angular.forEach(toSerialize, function(value) {
					serialize(value, prefix + '[]');
				});
			} else if (angular.isObject(toSerialize) && !angular.isDate(toSerialize)) {
				forEachSorted(toSerialize, function(value, key) {
					serialize(value, prefix +
							(topLevel ? '' : '[') +
							key +
							(topLevel ? '' : ']'));
				});
			} else {
				parts.push(encodeUriQuery(prefix) + '=' + encodeUriQuery(serializeValue(toSerialize)));
			}
		}
	}
	this.POST = function(options) {
		$http({
			method : 'POST',
			url : options.url,
			data : jQueryLikeParamSerializer(options.data),
			headers : {
				'Content-Type' : 'application/x-www-form-urlencoded'
			}
		}).success(function(data, status, headers) {
			if(data && data.number == 11){
				$ionicPopup.alert({
					title: 'Error',
					template: 'Session has been expired.'
				}).then(function(){
					localStorage.removeItem('sessionId');
					localStorage.removeItem('userContactId');
					localStorage.removeItem('userDetails');
					localStorage.removeItem('courseDetails');
					localStorage.removeItem('lastUpdated');
					$state.go("login");
				});
			}else{
				options.success(data);
			}
		}).error(function(data, status, headers){
			options.error(data);
		});
	};
	
	this.GET = function(options) {
		$http({
			method : 'GET',
			url : options.url,
			data : jQueryLikeParamSerializer(options.data),
			headers : {
				'Content-Type' : 'application/x-www-form-urlencoded'
			}
		}).success(function(data, status, headers) {
			if(data.number == 11){
				$ionicPopup.alert({
					title: 'Error',
					template: 'Session has been expired.'
				}).then(function(){
					localStorage.removeItem('sessionId');
					localStorage.removeItem('userContactId');
					localStorage.removeItem('userDetails');
					$state.go("login");
				});
			}else{
				options.success(data);
			}
		}).error(function(data, status, headers){
			options.error(data);
		});
	};
})

// fetch session id service
.service('SessionService', function($ionicPopup, NetworkService, md5, API_URL, PushRegistrationService){
	this.getSession = function(){ 
		var loginParams = {
				user_auth:{
					user_name:'mobile_user',
					password:md5.createHash('dv1@3$5'),
					version:"1"
				},
				application: "Genesis-Mobile-SugarCRM-Connector",
				name_value_list : {
					name : "language",
					value : "en_US"
				}
		};
		var dataToPost = {
				method: "login", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(loginParams)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = function(data){
			if(data.id) {
				localStorage.setItem('sessionId',data.id);
				if(window.cordova){
					PushRegistrationService.register();
				}
			}else{
				$ionicPopup.alert({
					title: 'Error',
					template: 'Unable to create session. Please try again.'
				});
			}
		};
		options.error = function(error){
			$ionicPopup.alert({
				title: 'Error',
				template: 'Unable to create session. Please try again.'
			});
		};

		NetworkService.POST(options);
	}
})

.service('FeedList', function ($rootScope, FeedLoader, $q){
	this.get = function(feedSourceUrl) {
		var response = $q.defer();
		//num is the number of results to pull form the source
		FeedLoader.fetch({q: feedSourceUrl, num: 20}, {}, function (data){
			response.resolve(data.responseData);
		});
		return response.promise;
	};
})

// App registration for push notification service
.service('PushRegistrationService', function ($ionicPopup, NetworkService, API_URL){
	this.register = function(){
		var regisParams = {
				"session": localStorage.getItem('sessionId'),
				"module_name": "GI_Mobile_Registrations",
				"name_value_list": [{"name":"name","value":localStorage.getItem('registrationId')},
				                    {"name":"description","value":localStorage.getItem('registrationId')},
				                    {"name": "device_os_c","value":ionic.Platform.isIOS()?'APN':'GCM'}]
		};
		var dataToPost = {
				method: "set_entry", 
				input_type: "JSON", 
				response_type: "JSON",
				rest_data: JSON.stringify(regisParams)
		};

		var options = {};
		options.url = API_URL;
		options.data = dataToPost;
		options.success = function(data){
			console.log('Push Notification Registration Success!!');
			console.log(data);
		};
		options.error = function(error){
			$ionicPopup.alert({
				title: 'Error',
				template: 'There is some problem in push registration.'
			});
		};

		NetworkService.POST(options);
	};
})

//PUSH NOTIFICATIONS
.service('PushNotificationsService', function ($rootScope, $cordovaPush, GCM_SENDER_ID, $q){
	/* Apple recommends you register your application for push notifications on the device every time it’s run since tokens can change. The documentation says: ‘By requesting the device token and passing it to the provider every time your application launches, you help to ensure that the provider has the current token for the device. If a user restores a backup to a device other than the one that the backup was created for (for example, the user migrates data to a new device), he or she must launch the application at least once for it to receive notifications again. If the user restores backup data to a new device or reinstalls the operating system, the device token changes. Moreover, never cache a device token and give that to your provider; always get the token from the system whenever you need it.’ */
	this.register = function() {
		var config = {};
		var deferred = $q.defer(); 
		// ANDROID PUSH NOTIFICATIONS
		if(ionic.Platform.isAndroid())
		{
			config = {
					"senderID": GCM_SENDER_ID
			};

			$cordovaPush.register(config).then(function(result) {
				console.log("$cordovaPush.register Success");
				console.log(result);
			}, function(err) {
				console.log("$cordovaPush.register Error");
				console.log(err);
			});

			$rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
				console.log(JSON.stringify([notification]));
				switch(notification.event)
				{
				case 'registered':
					if (notification.regid.length > 0 ) {
						console.log('registration ID = ' + notification.regid);
						localStorage.setItem('registrationId', notification.regid);
//						NodePushServer.storeDeviceToken("android", notification.regid);
					}
					break;

				case 'message':
					if(notification.foreground == "1")
					{
						console.log("Notification received when app was opened (foreground = true)");
					}
					else
					{
						if(notification.coldstart == "1")
						{
							console.log("Notification received when app was closed (not even in background, foreground = false, coldstart = true)");
						}
						else
						{
							console.log("Notification received when app was in background (started but not focused, foreground = false, coldstart = false)");
						}
					}

					// this is the actual push notification. its format depends on the data model from the push server
					console.log('message = ' + notification.message);
					break;

				case 'error':
					console.log('GCM error = ' + notification.msg);
					break;

				default:
					console.log('An unknown GCM event has occurred');
				break;
				}
				deferred.resolve(notification);
			});

			// WARNING: dangerous to unregister (results in loss of tokenID)
			// $cordovaPush.unregister(options).then(function(result) {
			//   // Success!
			// }, function(err) {
			//   // Error
			// });
		}

		if(ionic.Platform.isIOS())
		{
			config = {
					"badge": true,
					"sound": true,
					"alert": true
			};

			$cordovaPush.register(config).then(function(result) {
				// Success -- send deviceToken to server, and store for future use
				console.log("result: " + result);
				localStorage.setItem('registrationId', result);
				deferred.resolve(result);
//				NodePushServer.storeDeviceToken("ios", result);
			}, function(err) {
				console.log("Registration error: " + err);
			});

			$rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
				console.log(notification.alert, "Push Notification Received");
			});
		}
		
		return deferred.promise;
	};
})


//BOOKMARKS FUNCTIONS
.service('BookMarkService', function (_, $rootScope){

	this.bookmarkFeedPost = function(bookmark_post){

		var user_bookmarks = !_.isUndefined(window.localStorage.ionFullApp_feed_bookmarks) ?
				JSON.parse(window.localStorage.ionFullApp_feed_bookmarks) : [];

				//check if this post is already saved

				var existing_post = _.find(user_bookmarks, function(post){ return post.link == bookmark_post.link; });

				if(!existing_post){
					user_bookmarks.push({
						link: bookmark_post.link,
						title : bookmark_post.title,
						date: bookmark_post.publishedDate,
						excerpt: bookmark_post.contentSnippet
					});
				}

				window.localStorage.ionFullApp_feed_bookmarks = JSON.stringify(user_bookmarks);
				$rootScope.$broadcast("new-bookmark");
	};

	this.bookmarkWordpressPost = function(bookmark_post){

		var user_bookmarks = !_.isUndefined(window.localStorage.ionFullApp_wordpress_bookmarks) ?
				JSON.parse(window.localStorage.ionFullApp_wordpress_bookmarks) : [];

				//check if this post is already saved

				var existing_post = _.find(user_bookmarks, function(post){ return post.id == bookmark_post.id; });

				if(!existing_post){
					user_bookmarks.push({
						id: bookmark_post.id,
						title : bookmark_post.title,
						date: bookmark_post.date,
						excerpt: bookmark_post.excerpt
					});
				}

				window.localStorage.ionFullApp_wordpress_bookmarks = JSON.stringify(user_bookmarks);
				$rootScope.$broadcast("new-bookmark");
	};

	this.getBookmarks = function(){
		return {
			feeds : JSON.parse(window.localStorage.ionFullApp_feed_bookmarks || '[]'),
			wordpress: JSON.parse(window.localStorage.ionFullApp_wordpress_bookmarks || '[]')
		};
	};
})


//WP POSTS RELATED FUNCTIONS
.service('PostService', function ($rootScope, $http, $q, WORDPRESS_API_URL){

	this.getRecentPosts = function(page) {
		var deferred = $q.defer();

		$http.jsonp(WORDPRESS_API_URL + 'get_recent_posts/' +
				'?page='+ page +
		'&callback=JSON_CALLBACK')
		.success(function(data) {
			deferred.resolve(data);
		})
		.error(function(data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};


	this.getPost = function(postId) {
		var deferred = $q.defer();

		$http.jsonp(WORDPRESS_API_URL + 'get_post/' +
				'?post_id='+ postId +
		'&callback=JSON_CALLBACK')
		.success(function(data) {
			deferred.resolve(data);
		})
		.error(function(data) {
			deferred.reject(data);
		});

		return deferred.promise;
	};

	this.shortenPosts = function(posts) {
		//we will shorten the post
		//define the max length (characters) of your post content
		var maxLength = 500;
		return _.map(posts, function(post){
			if(post.content.length > maxLength){
				//trim the string to the maximum length
				var trimmedString = post.content.substr(0, maxLength);
				//re-trim if we are in the middle of a word
				trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf("</p>")));
				post.content = trimmedString;
			}
			return post;
		});
	};

	this.sharePost = function(link){
		window.plugins.socialsharing.share('Check this post here: ', null, null, link);
	};

})


;
