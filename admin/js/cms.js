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

CMS.CmsExpandingTextareaComponent = Ember.TextArea.extend({
  valueChanged: function() {
    if (this.element.scrollHeight > this.element.clientHeight) {
      this.element.style.height = this.element.scrollHeight + "px"
    }
  }.observes("value")
})

CMS.CmsMarkdownEditorComponent = Ember.Component.extend({
  showLinkbox: false,
  linkUrl: null,
  _getAbsoluteLinkUrl: function() {
    var url = this.get("linkUrl");
    if (url.indexOf("/") == 0) { return url; }
    if (url.match(/^https?:\/\//)) { return url; }
    if (url.match(/^mailto:/)) { return url; }
    return "http://" + url;
  },
  _getSelection: function() {
    var textarea = this.element.getElementsByTagName("textarea")[0],
        start = textarea.selectionStart,
        end   = textarea.selectionEnd;
    console.log(this.element);
    return {start: start, end: end, selected: (this.get("value") || "").substr(start, end-start)};
  },
  _setSelection: function(selection) {
    var textarea = this.element.getElementsByTagName("textarea")[0];
    textarea.focus();
    textarea.selectionStart = selection.start;
    textarea.selectionEnd = selection.end;
  },
  _surroundSelection: function(chars) {
    var selection = this._getSelection(),
        value = this.get("value") || "",
        changed = chars + selection.selected + chars,
        escapedChars = chars.replace(/\*/g, '\\*'),
        regexp = new RegExp("^" + escapedChars + ".+" + escapedChars + "$");

    if (regexp.test(selection.selected)) {
      changed = selection.selected.substr(chars.length,selection.selected.length - (chars.length * 2));
    } else if (value.substr(selection.start-chars.length,chars.length) == chars && value.substr(selection.end, chars.length) == chars) {
      selection.start = selection.start - chars.length;
      selection.end = selection.end+chars.length;
      changed = selection.selected;
    }
    
    var before = value.substr(0,selection.start),
        after  = value.substr(selection.end);

    this.set("value", before + changed + after);

    this._setSelection(selection);
  },
  actions: {
    bold: function() {
      this._surroundSelection("**");
    },
    italic: function() {
      this._surroundSelection("*");
    },
    link: function() {
      this._currentSelection = this._getSelection();
      this.set("showLinkbox", true);
      var el = this.element;
      setTimeout(function() { el.querySelector(".markdown-link-url").focus() }, 0);
    },
    insertLink: function() {
      if (this._currentSelection == null || this.get("showLinkbox") === false) { return }
      var selection = this._currentSelection,
          link      = "[" + (selection.selected || this.get("linkUrl")) + "](" + this._getAbsoluteLinkUrl() + ")",
          value     = this.get("value") || "",
          before    = value.substr(0, selection.start),
          after     = value.substr(selection.end);

      this.set("showLinkbox", false);
      this.set("linkUrl", null);
      this.set("value", before + link + after)
      selection.end = selection.start + link.end;
      this._setSelection(selection);
    }
  }
});