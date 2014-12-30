angular.module('cmsApp')
  .directive 'timespaceLinks', () ->
    restrict: 'E'
    replace: true
    scope:
      field: "="
    link: (scope, element, attrs) ->
      console.log "Scope when linking links: %o", scope
    controller: ($scope) ->
      console.log "Controller got scope: %o". $scope
      # Hello
    template: '''
    <h3>Hello from links</h3>
    '''