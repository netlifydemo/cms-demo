angular.module('cmsApp')
  .directive 'cmsWidget', ($location) ->
    {
      scope:
        field: "="
        item: "="
      restrict: 'E'
      replace: true
      link: (scope, element, attrs) ->
        scope.$watch "item.#{scope.field.name}", ->
          scope.field.value = scope.item[scope.field.name]

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
      link: (scope, element, attrs, _, transclude) ->
        tags = (scope.name || "div").split(" ")
        topLevel = document.createElement(tags.shift())
        topLevel.className = scope.className if scope.className
        el = topLevel
        while tagname = tags.shift()
          innerEl = document.createElement(tagname)
          el.appendChild(innerEl)
          el = innerEl
        transclude scope.$parent, (clone) ->
          for node in clone
            el.appendChild(node)
          element.replaceWith(topLevel)
      template: "<ng-transclude></ng-transclude>"
    }
  .directive 'markdownEditor', ($timeout) ->
    restrict: 'E'
    replace: true
    scope:
      ngModel: "="
      label: "="
    link: (scope, element, attrs) ->
      textarea = element.find("textarea")[0]

      autoGrow = ->
        $timeout ->
          if textarea.scrollHeight > textarea.clientHeight
            textarea.style.height = textarea.scrollHeight + "px"
      scope.$watch "ngModel", autoGrow

      getSelection = ->
        start = textarea.selectionStart
        end   = textarea.selectionEnd
        {
          start: start
          end: end
          selected: scope.ngModel.substr(start, end - start)
        }

      setSelection = (selection) ->
        $timeout ->
          textarea.selectionStart = selection.start
          textarea.selectionEnd = selection.end
          textarea.focus()        

      withSelection = (cb) ->
        selection = getSelection()
        newSelection = cb(selection.start, selection.end, selection.selected)
        setSelection(newSelection)

      scope.bold = ->
        withSelection (start, end, selected) ->
          if selected.match(/^\*\*.+\*\*$/)
            bolded = selected.substr(2,selected.length - 4)
          else if scope.ngModel.substr(start-2,2) == "**" && scope.ngModel.substr(end,2) == "**"
            start = start-2
            end = end+2
            bolded = selected
          else
            bolded = "**#{selected}**"

          before = scope.ngModel.substr(0, start)
          after  = scope.ngModel.substr(end)

          scope.ngModel = before + bolded + after
          {start: start, end: start + bolded.length}
        
      scope.em = ->
        withSelection (start, end, selected) ->
          if selected.match(/^\*.+\*$/)
            em = selected.substr(1,selected.length - 2)
          else if scope.ngModel.substr(start-1,1) == "*" && scope.ngModel.substr(end,2) == "*"
            start = start-1
            end = end+1
            em = selected
          else
            em = "*#{selected}*"

          before = scope.ngModel.substr(0, start)
          after  = scope.ngModel.substr(end)

          scope.ngModel = before + em + after
          {start: start, end: start + em.length}

      scope.link = ->
        return scope.linking = false if scope.linking

        input = element[0].querySelector(".markdown-link-url")
        scope.linkObj = {selection: getSelection()}
        scope.linking = true
        $timeout -> input.focus()

      scope.insertLink = ->
        selection = scope.linkObj.selection
        
        if scope.linkObj.url
          scope.linking = false
          link = "[#{selection.selected || scope.linkObj.url}](#{scope.linkObj.url})"
          before = scope.ngModel.substr(0, selection.start)
          after  = scope.ngModel.substr(selection.end)

          scope.ngModel = before + link + after
          end = selection.start + link.length
        else
          end = selection.end

        setSelection(start: selection.start, end: end)

      scope.linkKey = (e) ->
        if e.keyCode == 13 # Enter
          e.preventDefault()
          scope.insertLink()

    template: '''
    <div class="markdown-editor"">
      <div class="markdown-label">
        <label>{{label}}</label>
      </div>
      <div class="markdown-menu">
        <a ng-click="bold()" class="markdown-menu-icon markdown-icon-bold">Bold</a>
        <a ng-click="em()" class="markdown-menu-icon markdown-icon-italic">Italic</a>
        <a ng-click="link()" class="markdown-menu-icon markdown-icon-link">Link</a>
      </div>
      <div class="markdown-link-box clearfix" ng-show="linking">
        <input class="markdown-link-url" ng-model="linkObj.url" placeholder="https://www.netlify.com" ng-blur="insertLink()" ng-keypress="linkKey($event)">
      </div>
      <div class="mardown-body">
        <textarea ng-model="ngModel" style="overflow: hidden;">
      </div>
    </div>
    '''

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