angular.module('cmsApp').service 'Media', ($q, Github) ->
  uploads = {}
  {
    add: (path, file) ->
      console.log "Tryign to read file: %o", file
      defered = $q.defer()
      reader = new FileReader
      reader.onload = ->
        mediaFile = {
          name: file.name
          size: file.size
          path: path
          src: reader.result
          base64: ->
            @src.split(",").pop()
        }
        uploads[path] = mediaFile
        defered.resolve(mediaFile)
        # This enables background uploads as soon as a file is dropped
        # Alternatively files will be uploaded when the document is saved
        # mediaFile.upload = Github.uploadBlob(mediaFile)

      reader.readAsDataURL(file)
      defered.promise

    get: (path) ->
      uploads[path] || {
        path: path
        src: path
      }

    remove: (path) ->
      file = uploads[path]
      delete uploads[path] if file
      file

    mv: (oldPath, newPath) ->
      console.log "Moving %s to %s", oldPath, newPath
      file = @remove(oldPath)
      if file
        console.log "Removed %o", file
        file.path = newPath
        file.name = newPath.split("/").pop()
        uploads[newPath] = file
      file

    list: (dir) ->
      # List files

    uploads: -> (upload for path, upload of uploads)

    reset: -> uploads = {}
  }