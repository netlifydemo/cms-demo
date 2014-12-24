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
        {label: "Course Info", name: "info", widget: "markdown_string"}
      ]
    },
    {
      slug: "articles"
      label: "Articles"
      singular: "Article"
      folder: "_articles"
      create: true
      fields: [
        {label: "Title", name: "title", widget: "title"}
        {label: "Subtitle", name: "subtitle", widget: "string"}
        {label: "Full Title", name: "full_title", widget: "string"}
        {label: "Bibliography entry", name: "bib", widget: "markdown_string"}
        {label: "Links", name: "links", widget: "links"}
        {label: "Date", name: "date", widget: "date"}
      ]
    },
    {
      slug: "books"
      label: "Books"
      singular: "Book"
      folder: "_books"
      fields: [
        {label: "Title", name: "title", widget: "title"}
        {label: "Subtitle", name: "subtitle", widget: "string"}
        {label: "Full Title", name: "full_title", widget: "string"}
        {label: "Bibliography entry", name: "bib", widget: "markdown_string"}
        {label: "Image", name: "image", widget: "image", folder: "images"}
      ]
    }
  ]
