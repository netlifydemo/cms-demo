angular.module('cmsApp').service 'Collections', ->
  [
    {
      slug: "courses"
      label: "Courses"
      singular: "Course"
      folder: "_courses"
      create: true
      fields: [
        {label: "Title", name: "title", widget: "title"}
        {label: "Course Info", name: "info", widget: "markdown", class: "meta"}
        {label: "Course Description", name: "body", widget: "markdown"}
      ]
    },
    {
      slug: "articles"
      label: "Articles"
      singular: "Article"
      folder: "_articles"
      create: true
      fields: [
        {label: "Title", name: "title", widget: "string", tagname: "h1"}
        {label: "Subtitle", name: "subtitle", widget: "string", tagname: "h1 small"}
        {label: "Full Title", name: "full_title", widget: "string", tagname: "h3"}
        {label: "Bibliography entry", name: "bib", widget: "markdown", class: "condensed"}
        {label: "Links", name: "links", widget: "markdown_string"}
        {label: "Footer", name: "footer", widget: "markdown_string"}
        {label: "Article Abstract", name: "body", widget: "markdown"}
      ]
    },
    {
      slug: "books"
      label: "Books"
      singular: "Book"
      folder: "_books"
      fields: [
        {label: "Title", name: "title", widget: "string", tagname: "h1"}
        {label: "Subtitle", name: "subtitle", widget: "string", tagname: "h3"}
        {label: "Full Title", name: "full_title", widget: "string", tagname: "h3"}
        {label: "Bibliography entry", name: "bib", widget: "markdown", class: "condensed"}
        {label: "Image", name: "image", widget: "image", folder: "images"}
        {label: "Book Abstract", name: "body", widget: "markdown"}
      ]
    },
    {
      slug: "pages"
      label: "Pages"
      singular: "Page"
      folder: "pages"
      fields: [
        {label: "Title", name: "title", widget: "string", tagname: "h1"}
        {label: "Body Text", name: "body", widget: "markdown"}
      ]
    }
  ]
