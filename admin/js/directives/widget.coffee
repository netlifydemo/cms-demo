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
        <div class="widget {{field.widget}} clearfix">
          <div class="form-control">
            <ng-include src="getTemplateUrl()"/>
          </div>
          <div class="preview">
            <ng-include src="getTemplateUrl(true)"/>
          </div>
        </div>
        '''
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