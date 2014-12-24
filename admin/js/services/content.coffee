angular.module('cmsApp').service 'Content', ($http) ->
  {
    all: ->
      $http.get("/admin/content.json")
    last_update: ->
      $http.get("/admin/ts.json")
  }