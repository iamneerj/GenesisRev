//Ionic Starter App

angular.module('underscore', [])
.factory('_', function() {
	return window._; // assumes underscore has already been loaded on the page
});

//angular.module is a global place for creating, registering and retrieving Angular modules
//'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
//the 2nd parameter is an array of 'requires'
angular.module('GenesisApp', ['ionic', 
                              'angularMoment',
                              'GenesisApp.controllers',
                              'GenesisApp.directives',
                              'GenesisApp.filters',
                              'GenesisApp.services',
                              'GenesisApp.factories',
                              'GenesisApp.config',
                              'underscore',
                              'ngMap',
                              'ngResource',
                              'ngCordova',
                              'templates',
                              'slugifier',
                              'ionic.contrib.ui.tinderCards',
                              'angular-md5',
                              'httpInterceptor'])

.run(function($ionicPlatform, PushNotificationsService, $state, SessionService,PushRegistrationService, $rootScope) {

	$ionicPlatform.on("deviceready", function(){
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if(window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if(window.StatusBar) {
			StatusBar.styleDefault();
		}
		
		PushNotificationsService.register().then(function(){
			console.log('Calling push notification then function');
			if(localStorage.getItem('sessionId')){
				PushRegistrationService.register();
				if(localStorage.getItem('userContactId')){
					$state.go('app.home');
				}else{
					$state.go('login');
				}
			}else{
				$state.go('login');
			}
		});
		
	});

//	$ionicPlatform.on("resume", function(){
//		PushNotificationsService.register();
//	});
	
	$rootScope.clearLocalStorage = function(){
		localStorage.removeItem('sessionId');
		localStorage.removeItem('userContactId');
		localStorage.removeItem('userDetails');
		localStorage.removeItem('courseDetails');
		localStorage.removeItem('lastUpdatedSchedule');
		localStorage.removeItem('lastUpdatedSessions');
		localStorage.removeItem('mycourses');
		localStorage.removeItem('mycoursesDetails');
		localStorage.removeItem('mycoursesSessions');
	};
	
//	if(localStorage.getItem('sessionId') && localStorage.getItem('userContactId')){
//		$state.go('app.home');
//	}else{
//		$state.go('login');
//	}
	
})


.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
	$ionicConfigProvider.views.maxCache(0);
	$stateProvider

//	.state('walkthrough', {
//	url: "/",
//	templateUrl: "walkthrough.html",
//	controller: 'WalkthroughCtrl'
//	})
	
	.state('signup', {
		url: "/signup",
		templateUrl: "signup.html",
		controller: 'SignupCtrl'
	})

	.state('login', {
		url: "/login",
		templateUrl: "login.html",
		controller: 'LoginCtrl as loginCtrl'
	})

	.state('forgot-password', {
		url: "/forgot-password",
		templateUrl: "forgot-password.html",
		controller: 'ForgotPasswordCtrl'
	})

	.state('app', {
		url: "/app",
		abstract: true,
		templateUrl: "side-menu.html",
		controller: 'AppCtrl'
	})
	
	.state('app.home', {
		url: "/home",
		views: {
			'menuContent': {
				templateUrl: "home.html",
				controller: 'HomeCtrl as homeCtrl'
			}
		}
	})
	
	.state('app.mycourses', {
		url: "/courses-schedule",
		views: {
			'menuContent': {
				templateUrl: "courses.html",
				controller: 'CoursesScheduleCtrl as coursesCtrl'
			}
		}
	})
	
	.state('app.upcomingsessions', {
		url: "/upcoming-sessions",
		views: {
			'menuContent': {
				templateUrl: "upcoming-session.html",
				controller: 'UpcomingSessionsCtrl as upsessCtrl'
			}
		}
	})
	
	.state('app.latestmessage', {
		url: "/latest-message",
		views: {
			'menuContent': {
				templateUrl: "latest-message.html",
				controller: 'LatestMessageCtrl as latestMessCtrl'
			}
		}
	})

	//MISCELLANEOUS
	.state('app.miscellaneous', {
		url: "/miscellaneous",
		views: {
			'menuContent': {
				templateUrl: "miscellaneous.html",
				controller: 'MiscellaneousCtrl'
			}
		}
	})

	.state('app.maps', {
		url: "/miscellaneous/maps",
		views: {
			'menuContent': {
				templateUrl: "maps.html",
				controller: 'MapsCtrl'
			}
		}
	})

	.state('app.image-picker', {
		url: "/miscellaneous/image-picker",
		views: {
			'menuContent': {
				templateUrl: "image-picker.html",
				controller: 'ImagePickerCtrl'
			}
		}
	})



	//LAYOUTS
	.state('app.layouts', {
		url: "/layouts",
		views: {
			'menuContent': {
				templateUrl: "layouts.html",
				controller: 'LayoutsCtrl'
			}
		}
	})

	.state('app.tinder-cards', {
		url: "/layouts/tinder-cards",
		views: {
			'menuContent': {
				templateUrl: "tinder-cards.html",
				controller: 'TinderCardsCtrl'
			}
		}
	})

	.state('app.slider', {
		url: "/layouts/slider",
		views: {
			'menuContent': {
				templateUrl: "slider.html",
				controller: 'SliderCtrl'
			}
		}
	})



	//FEEDS
	.state('app.feeds-categories', {
		url: "/feeds-categories",
		views: {
			'menuContent': {
				templateUrl: "feeds-categories.html",
				controller: 'FeedsCategoriesCtrl'
			}
		}
	})

	.state('app.category-feeds', {
		url: "/category-feeds/:categoryId",
		views: {
			'menuContent': {
				templateUrl: "category-feeds.html",
				controller: 'CategoryFeedsCtrl'
			}
		}
	})

	.state('app.feed-entries', {
		url: "/feed-entries/:categoryId/:sourceId",
		views: {
			'menuContent': {
				templateUrl: "feed-entries.html",
				controller: 'FeedEntriesCtrl'
			}
		}
	})


	//WORDPRESS
	.state('app.wordpress', {
		url: "/wordpress",
		views: {
			'menuContent': {
				templateUrl: "wordpress.html",
				controller: 'WordpressCtrl'
			}
		}
	})

	.state('app.post', {
		url: "/wordpress/:postId",
		views: {
			'menuContent': {
				templateUrl: "wordpress_post.html",
				controller: 'WordpressPostCtrl'
			}
		}
	})


	//OTHERS
	.state('app.settings', {
		url: "/settings",
		views: {
			'menuContent': {
				templateUrl: "settings.html",
				controller: 'SettingsCtrl'
			}
		}
	})

	.state('app.forms', {
		url: "/forms",
		views: {
			'menuContent': {
				templateUrl: "forms.html",
				controller: 'FormsCtrl'
			}
		}
	})

	.state('app.profile', {
		url: "/profile",
		views: {
			'menuContent': {
				templateUrl: "profile.html",
				controller: 'ProfileCtrl'
			}
		}
	})

	.state('app.bookmarks', {
		url: "/bookmarks",
		views: {
			'menuContent': {
				templateUrl: "bookmarks.html",
				controller: 'BookMarksCtrl'
			}
		}
	})

	;

	// if none of the above states are matched, use this as the fallback
//	$urlRouterProvider.otherwise('/login');
});
