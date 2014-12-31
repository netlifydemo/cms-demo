angular.module('cmsApp')
  .directive 'timespaceDropzone', ($rootScope, $q, Media) ->
    isFileDrag = (event) ->
      return false unless event.dataTransfer && event.dataTransfer.types
      for type in event.dataTransfer.types
        return true if type == "Files"
      false
    {
      restrict: 'E'
      replace: true
      scope:
        callback: "="
      link: (scope, element, attrs) ->
        element.on "dragenter", (event) ->
          event.preventDefault()
          return unless isFileDrag(event)
          element.addClass "drag"

        element.on "dragleave", (event) ->
          event.preventDefault()
          element.removeClass "drag"

        element.on "dragover", (event) -> event.preventDefault()

        element.on "drop", (event) ->
          event.preventDefault()
          return false unless isFileDrag(event)
          uploads = (Media.add("/#{attrs.folder || 'uploads'}/#{file.name}", file) for file in event.dataTransfer.files)
          $q.all(uploads).then (uploads) ->
            scope.callback(uploads)
          

      template: '''
      <div class="timespace-dropzone">
          <p>Drag files here to add file downloads</p>
      </div>
      '''
    }
  .directive 'timespaceLinks', (Media) ->
    restrict: 'E'
    replace: true
    scope:
      field: "="
    controller: ($scope) ->
      $scope.link = {}
      
      $scope.add = (url, label, upload) ->
        return unless url || $scope.link.url && label || $scope.link.label
        item = {url: url || $scope.link.url, label: label || $scope.link.label, $upload: upload}
        $scope.field.value ||= []
        $scope.field.value.push(item)
        $scope.link = {}
        item

      $scope.remove = (index) ->
        link = $scope.field.value && $scope.field.value[index]
        return unless link
        Media.remove(link.$upload.path) if link.$upload
        $scope.field.value = (e for e,i in $scope.field.value when i != index)

      $scope.rename = (index) ->
        link = $scope.field.value && $scope.field.value[index]
        link.$upload = Media.mv(link.$upload.path, link.url) if link && link.$upload

      $scope.upload = (uploads) ->
        for upload in uploads
          $scope.add(upload.path, upload.name, upload)

    template: '''
    <div class="timespace-links">
      <div class="link-inputs" ng-repeat="link in field.value">
        <input class="link-label" ng-model="link.label">
        <input class="link-url" ng-model="link.url" ng-change="rename($index)">
        <a class="link-remove-icon link-icon" ng-click="remove($index)" title="Remove this link"></a>
      </div>
      <div class="link-inputs">
        <input class="link-label" ng-model="link.label" placeholder="Link label">
        <input class="link-url" ng-model="link.url" placeholder="URL to link to" ng-blur="add()">
        <a class="link-add-icon link-icon" ng-click="add()" title="Add new link"></a>
      </div>
    </div>
    '''
  .directive 'timespaceFiles', (Media) ->
    restrict: 'E'
    replace: true
    scope:
      field: "="
    controller: ($scope) ->
      $scope.link = {}
      
      $scope.add = (url, label, upload) ->
        return unless url || $scope.link.url && label || $scope.link.label
        item = {url: url || $scope.link.url, label: label || $scope.link.label, $upload: upload}
        $scope.field.value ||= []
        $scope.field.value.push(item)
        $scope.link = {}
        item

      $scope.remove = (index) ->
        link = $scope.field.value && $scope.field.value[index]
        return unless link
        Media.remove(link.$upload.path) if link.$upload
        $scope.field.value = (e for e,i in $scope.field.value when i != index)

      $scope.rename = (index) ->
        link = $scope.field.value && $scope.field.value[index]
        link.$upload = Media.mv(link.$upload.path, link.url) if link && link.$upload

      $scope.upload = (uploads) ->
        for upload in uploads
          $scope.add(upload.path, upload.name, upload)

    template: '''
    <div class="timespace-files">
      <div class="file-inputs" ng-repeat="link in field.value">
        <input class="file-label" ng-model="link.label">
        <a class="file-remove-icon file-icon" ng-click="remove($index)" title="Remove this file"></a>
      </div>
      <timespace-dropzone callback="upload" folder="{{field.folder}}"></timespace-dropzone>
    </div>
    '''