# Netlify CMS

Installing:

Your static site generator must generate a new page called /admin with the following index.html:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Management</title>
  <link rel="stylesheet" href="//cms.netlify.com/admin.css" />

  <base href="/admin/">
</head>
<body>
  <script src="//cms.netlify.com/admin.js"></script>
</body>
</html>
```

You'll then need to confiure Netlify CMS for your static site generator by setting up an admin/config.yml file:

```yaml
repo: user/name # Path to your Github repository
branch: master # Branch to update (master by default)
collections: # A list of collections the CMS should be able to edit
  - slug: "post" # Used in routes, ie.: /admin/collections/:slug/edit
    label: "Post" # Used in the UI, ie.: "New Post"
    folder: "_posts" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields each document in this collection have
      - {label: "Title", name: "title", widget: "string", tagname: "h1"}
      - {label: "Body", name: "body", widget: "markdown"}
```

That's all, you now have a CMS that'll let people post new blogposts with a title and a body.

## Widgets

When describing the fields for your collections, you can specify a widget that'll control the form element and the preview element when editing that field. if you don't specify a widget, the field will be intepreted as a simple text input.

Some widgets take extra options that you can add to the field definition. Eg.: the "string" widget will let you specify a "tagname" and a "classname" that will be used when showing the preview of the value.

Here's a list of all the built in widgets and the options they take:

### string

### number

### markdown

### date

### image

### file

### images

### files

### tags

### link

### has_one

### has_many

### list


## Custom Widgets

It's very easy to add your own custom widgets, ranging from simply customizing the templates used for showing form elements or previewing values.

Templates 


CMS.Widget = Ember.Object.extend({
  validations: {
    presense
  },
  valid: false,
  value: null,
  field: null,
  document: null,
  validate: function() {

  }.observes("value"),
  init: function() {
    this._super.apply(arguments);
    if (!this.field.optional) {
      this.validations.push(this.validators.required);
    }
  },
  validators: {
    required: function(value) {
      return !!value;
    }
  }
});




