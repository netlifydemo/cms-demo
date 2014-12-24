---
---

angular.module('cmsApp').service 'Github', ["$http", ($http) ->
  ENDPOINT = "https://api.github.com/"
  REPO = "biilmann/timespace.dk"
  GithubToken = null

  request = (method, path, config, cb) ->
    headers = {"Authorization": "token #{GithubToken}"}

    $http(
      url: ENDPOINT + path
      method: method.toUpperCase()
      headers: angular.extend({}, headers, config.headers)
      params: config.params
      data: config.data
      transformResponse: config.transformResponse || $http.defaults.transformResponse
    ).then (response) ->
      if cb then cb(response.data, response.headers) else response.data

  {
    hasToken: -> !!GithubToken
    setToken: (token) -> GithubToken = token
    
    repo_branches: (cb) ->
      request("get", "repos/#{REPO}/branches", {}, cb)

    repo_contents: (cb) ->
      request("get", "repos/#{REPO}/contents/", {}, cb)

    repo_file: (options, cb) ->
      "application/vnd.github.VERSION.raw"
      request("get", "repos/#{REPO}/contents/#{options.path}", {headers: {"Accept": "application/vnd.github.VERSION.raw"}, transformResponse: angular.identity}, cb)
  }
]