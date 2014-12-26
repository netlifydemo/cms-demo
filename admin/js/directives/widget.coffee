angular.module('cmsApp')
  .directive 'cmsWidget', ($location) ->
    {
      scope:
        field: "="
        item: "="
      restrict: 'E'
      replace: true
      link: (scope, element, attrs) ->
        console.log "Got linked to %o with scope %o and attrs: %o", element, scope, attrs
        scope.getTemplateUrl = (preview) ->
          "/admin/views/widgets/#{scope.field.widget}#{if preview then "_preview" else ""}.html"
      template: 
        '''
        <div class="widget {{field.widget}}">
          <div class="form-control">
            <ng-include src="getTemplateUrl()"/>
          </div>
          <div class="preview">
            <ng-include src="getTemplateUrl(true)"/>
          </div>
        </div>
        '''
    }
  .directive 'tag', ($compile) ->
    {
      transclude: true
      replace: true
      restrict: 'E'
      scope:
        name: "="
        class: "="
      # compile: (cEl, cAttrs, transclude) ->
      #   console.log "Compiling: %o, %o", element, attrs
      #   (scope, element, attrs) ->

      #     element.replaceWith($compile("<#{scope.name} class='#{scope.class || ''}' ng-transclude><#{scope.name}>")(scope))
          
      #     console.log "Linking %o", scope
      link: (scope, element, attrs, _, transclude) ->
        el = document.createElement(scope.name || "div")
        el.className = scope.className if scope.className
        transclude scope.$parent, (clone) ->
          console.log "Got clone: %o", clone
          for node in clone
            el.appendChild(node)
          element.replaceWith(el)
      #   console.log "TF: %o", transclude, scope
      #   element.replaceWith($compile("<#{scope.name} class='#{scope.class || ''}' ng-transclude><#{scope.name}>")(scope))
      template: "<ng-transclude></ng-transclude>"
    }
  .provider 'markdown', ->
    opts = {}
    {
      config: (newOpts) -> opts = newOpts
      $get: -> new Showdown.converter(opts)
    }
 .filter 'markdown', ($sce, markdown) ->
    (text) ->
      return '' unless text
      html = markdown.makeHtml(text)
      $sce.trustAsHtml(html)