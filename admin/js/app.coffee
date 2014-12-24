angular
  .module('cmsApp', [
    'ngRoute'
    'monospaced.elastic'
  ])
  .config ($routeProvider, $locationProvider, $httpProvider, $provide) ->
    console.log "Helloooo"
    netlify.configure({site_id: "consultant-geraldine-65480.netlify.lo"})

    $locationProvider.html5Mode({enabled: true, requireBase: false})
    console.log "Configuring routes"
    $routeProvider
      .when '/admin/',
        templateUrl: "/admin/views/index.html"
        controller: "CMSCtrl"
      .when '/admin/:collection/new',
        templateUrl: "/admin/views/new.html"
        controller: "CMSCtrl"
      .when '/admin/:collection/:slug/edit',
        templateUrl: "/admin/views/new.html"
        controller: "CMSCtrl"
      .when '/admin/login',
        templateUrl: "/admin/views/login.html"
        controller: "LoginCtrl"
        public: true
      .when '/admin/logout',
        resolve: {logout: ["Github", (Github) -> Github.removeToken()]}
        redirectTo: '/login'
      .otherwise
        redirectTo: '/admin/'
  .run ($rootScope, $location, Github) ->
    $rootScope.$on "$routeChangeStart", (event, next, current) ->
      console.log "Github has token: %o", Github.hasToken()
      unless Github.hasToken() || (next? && next.$$route.public)
        $location.path("/admin/login")