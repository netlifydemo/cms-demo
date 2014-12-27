angular.module('cmsApp').service 'Github', ($http) ->
  ENDPOINT = "https://api.github.com/"
  REPO = "biilmann/timespace.dk"
  BRANCH = "cms"
  GithubToken = localStorage.getItem("gh_token")

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
    setToken: (token) ->
      GithubToken = token
      localStorage.setItem("gh_token", token)
    removeToken: ->
      GithubToken = null
      localStorage.removeItem("gh_token")
    
    repo_branches: (cb) ->
      request("get", "repos/#{REPO}/branches", {}, cb)

    repo_contents: (cb) ->
      request("get", "repos/#{REPO}/contents/", {}, cb)

    repo_file_info: (options, cb) ->
      request("get", "repos/#{REPO}/contents/#{options.path}", {
        params: {ref: BRANCH}
      }, cb)

    repo_file: (options, cb) ->
      request("get", "repos/#{REPO}/contents/#{options.path}", {
        headers: {"Accept": "application/vnd.github.VERSION.raw"},
        transformResponse: angular.identity,
        params: {ref: BRANCH}
      }, cb)

    update_file: (options, cb) ->
      console.log "Updating file %o", options
      request("put", "repos/#{REPO}/contents/#{options.path}", {
        data: {
          message: options.message
          content: Base64.encode(options.content)
          sha: options.sha
          branch: BRANCH
        }
      }, cb)
  }