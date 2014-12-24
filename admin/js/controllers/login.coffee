angular.module('cmsApp').controller 'LoginCtrl', ($rootScope, $scope, $location, Github) ->
  # Hnn
  $scope.loginPopup = ->
    netlify.authenticate {provider: "github", scope: "repo"}, (err, data) ->
      console.log "Got login result: %o - %o", err, data
      $scope.$apply ->
        if err
          $scope.login_error = err.message
        else
          Github.setToken(data.token)
          $location.url("/admin/")