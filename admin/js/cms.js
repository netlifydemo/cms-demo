"use strict";

window.CMS = Ember.Application.create();

CMS.ApplicationView = Ember.View.extend({});
CMS.ApplicationController = Ember.Controller.extend({
  currentAction: "Dashboard"
});

CMS.Config = new Ember.RSVP.Promise(function(resolve, reject) {
  $.get("config.yml").then(function(data) {
    //var config = Ember.Object.extend({}).create(jsyaml.safeLoad(data));
    //resolve(config);
    resolve(jsyaml.safeLoad(data))
  }, function(err) {
    reject(err);
  })
});

CMS.Router.map(function() {
  this.route("home", {path: "/"}),
  this.resource('collections', {path: '/collections/:collection_id'}, function() {
    this.route('new');
  });
});

CMS.HomeRoute = Ember.Route.extend({
  model: function() { return CMS.Config; }
});

CMS.HomeController = Ember.ObjectController.extend({
  collections: function() {
    return (this.get("model.collections") || []).map(function(c) {
      c.id = c.slug
      return c;
    });
  }.property("model.collections")
});

CMS.Collection = Ember.Object.extend({})
CMS.Collection.reopenClass({
  find: function(id) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      CMS.Config.then(function(config) {
        var collection = config.collections.filter(function(c) { return c.slug == id})[0];
        if (collection) {
          collection.id = collection.slug;
          resolve(CMS.Collection.create(collection));
        } else {
          reject("No collection found");
        }
      })
    });
  }
})

CMS.Field = Ember.Object.extend({});
CMS.FieldController = Ember.ObjectController.extend({
  value: null
});

Ember.Handlebars.registerBoundHelper("cms-markdown-viewer", function(value) {
  return new Ember.Handlebars.SafeString(marked(value || ""));
});

CMS.CmsWidgetControlComponent = Ember.Component.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.set("templateName", "widgets/" + this.field.get("widget"));
  }
});

CMS.CmsWidgetPreviewComponent = Ember.Component.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.set("templateName", "widgets/" + (this.field.get("preview") || this.field.get("widget") + "_preview"));
  }
});