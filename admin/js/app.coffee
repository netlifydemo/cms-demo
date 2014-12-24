---
---

angular
  .module('cmsApp', [
    'ngRoute'
  ])
  .config ["$routeProvider", "$locationProvider", "$httpProvider", "$provide", ($routeProvider, $locationProvider, $httpProvider, $provide) ->
    console.log "Helloooo"
    window.NETLIFY_CFG = {api_base: "http://api.netlify.lo/api/v1/"}

    netlify.configure({site_id: "consultant-geraldine-65480.netlify.lo"})

    $locationProvider.html5Mode({enabled: true, requireBase: false})
    console.log "Configuring routes"
    $routeProvider
      .when '/admin/',
        templateUrl: "/admin/views/index.html"
        controller: "CMSCtrl"
      .when '/admin/login',
        templateUrl: "/admin/views/login.html"
        controller: "LoginCtrl"
        public: true
      .otherwise
        redirectTo: '/admin/'
  ]
  .run ["$rootScope", "$location", ($rootScope, $location) ->
    console.log "running"
    loadUser = ->
      json = localStorage && localStorage.getItem("user")

    $rootScope.$on "$routeChangeStart", (event, next, current) ->
      loadUser() unless $rootScope.user

    unless $rootScope.user || (next? && next.$$route.public)
      $rootScope.site = null
      $rootScope.return_to = $location.path
      $location.path("/admin/login")
  ]