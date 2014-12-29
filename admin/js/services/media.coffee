angular.module('cmsApp').service 'Media', ($q, Github) ->
  uploads = {}
  {
    add: (path, file) ->
      defered = $q.defer()
      reader = new FileReader
      reader.onload = ->
        upload = {
          path: path
          src: reader.result
          base64: ->
            @src.split(",").pop()
        }
        uploads[path] = upload
        defered.resolve(upload)
      reader.readAsDataURL(file)
      defered.promise

    get: (path) ->
      uploads[path] || {
        path: path
        src: path
      }

    list: (dir) ->
      # List files

    uploads: -> (upload for path, upload of uploads)

    reset: -> uploads = {}
  }