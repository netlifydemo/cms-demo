angular.module('cmsApp').directive 'cmsWidget', ($location) ->
  {
    restrict: 'E'
    replace: true
    link: (scope, element, attrs) ->
      console.log "Got linked to %o with scope %o and attrs: %o", element, scope, attrs
      scope.name = "Mathias"
    template: '''
    <h2>Hello {{name}}</h2>
    '''
  }
