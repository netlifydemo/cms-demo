angular.module('cmsApp').service 'Github', ($http, $q) ->
  ENDPOINT = "https://api.github.com/"
  REPO = "biilmann/timespace.dk"
  BRANCH = "tree-api"
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

    repo_branch: (cb) ->
      request("get", "repos/#{REPO}/branches/#{BRANCH}", {}, cb)

    repo_tree: (sha, cb) ->
      request("get", "repos/#{REPO}/git/trees/#{sha}", {}, cb)


    updateTree: (sha, path, fileTree) ->
      defered = $q.defer()
      @repo_tree sha, (tree) =>
        updates = []
        for obj in tree.tree
          if fileOrDir = fileTree[obj.path]
            if fileOrDir.content
              fileOrDir.added = true
              updates.push({
                path: obj.path
                mode: obj.mode
                type: obj.type
                content: fileOrDir.content
              })
            else
              updates.push(@updateTree(obj.sha, obj.path, fileOrDir))
          else
            updates.push({
              path: obj.path
              mode: obj.mode
              type: obj.type
              sha: obj.sha
            })
        $q.all(updates).then (updates) ->
          request "post", "repos/#{REPO}/git/trees", {
              data: {
                base_tree: sha,
                tree: updates
              }
            }, (response) ->
              defered.resolve({
                path: path
                mode: "040000"
                type: "tree"
                sha: response.sha
              })
              console.log "Updates: %o", updates

      defered.promise


    update_files: (options, cb) ->
      fileTree = {}
      console.log "Got files: %o", options
      for file in options.files 
        parts = (part for part in file.path.split("/") when part)
        filename = parts.pop()
        subtree = fileTree
        while part = parts.shift()
          subtree[part] ||= {}
          subtree = subtree[part]
        subtree[filename] = file
      console.log "tree: %o", fileTree
      @repo_branch (branch) =>
        @updateTree(branch.commit.sha, '/', fileTree).then (changeTree) ->
          request "post", "repos/#{REPO}/git/commits", {data: {
            message: options.message
            tree: changeTree.sha
            parents: [branch.commit.sha]
          }}, (response) ->
            request "patch", "repos/#{REPO}/git/refs/heads/#{BRANCH}", {data: {sha: response.sha}}, (ref) ->
              cb(ref)

  }