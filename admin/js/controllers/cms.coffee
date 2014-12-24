
angular.module('cmsApp').controller 'CMSCtrl', ($rootScope, $scope, $routeParams, Github, Collections, Content) ->
  regexp = /^---\n([^]*?)\n---\n([^]*)$/
  $scope.collections = Collections
  $scope.item = {}

  slugify = (text) ->
     text.toString().toLowerCase()
      .replace(/\s+/g, '-')           # Replace spaces with -
      .replace(/[^\w\-]+/g, '')       #/ Remove all non-word chars
      .replace(/\-\-+/g, '-')         # Replace multiple - with single -
      .replace(/^-+/, '')             # Trim - from start of text
      .replace(/-+$/, '');            # Trim - from end of text

  itemSlug = ->
    return $routeParams.slug if $routeParams.slug
    date = new Date
    "#{date.getFullYear()}-#{date.getMonth() + 1}-#{date.getDate()}-#{slugify($scope.item.title)}"

  filePath = ->
    $scope.collection.folder + "/" + itemSlug() + ".md"

  parseContent = (content) ->
    match = content.match(regexp)
    item = jsyaml.safeLoad(match[1])
    item.body = match[2]
    item

  generateContent = (item) ->
    content = "---\n"
    meta = {}
    for field in $scope.collection.fields
      meta[field.name] = item[field.name]
    content += jsyaml.safeDump(meta)
    content += "---\n"
    content += item.body
    content

  Content.all().then (response) ->
    $scope.sitemap = response.data
  Content.last_update().then (response) ->
    $scope.last_update = response.data.ts

  if $routeParams.collection
    $scope.collection = (c for c in Collections when c.slug == $routeParams.collection)[0]

  if $routeParams.slug
    $rootScope.action = "Edit #{$scope.collection.singular}"
    $scope.loading = true
    Github.repo_file {path: filePath()}, (content) ->
      $scope.item = parseContent(content)
      $scope.loading = false
      Github.repo_file_info {path: filePath()}, (info) ->
        $scope.item.$sha = info.sha
  else
    $rootScope.action = if $routeParams.collection then "New #{$scope.collection.singular}" else null
    $scope.new_item = true
    $scope.loading = false

  $scope.save = ->
    $scope.saving = true
    content = generateContent($scope.item)
    Github.update_file {
      path: filePath()
      message: "Updated #{$scope.collection.singular} #{$scope.item.title}"
      content: content,
      sha: $scope.item.$sha
    }, ->
      console.log "Saved?"