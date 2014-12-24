angular.module('cmsApp').service 'Deploy', ($http, $timeout) ->
  ts = null

  {
    withTimestamp: (fn) ->
      $http.get("/admin/ts.json").then (response) ->
        console.log("TS: %o", response.data.ts);
        ts = new Date(response.data.ts).getTime()
        fn()

    waitForDeploy: (fn) ->
      poll = =>
        before = ts
        @withTimestamp ->
          return fn() if before != ts
          $timeout poll, 1000
      poll()
  }