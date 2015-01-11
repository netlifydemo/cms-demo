"use strict";

window.CMS = Ember.Application.create();
CMS.deferReadiness();
$.get("config.yml").then(function(data) {
  CMS.config = CMS.Config.create(jsyaml.safeLoad(data));
  CMS.advanceReadiness();
});

CMS.Config = Ember.Object.extend({
  init: function() {
    var collections = [];
    for (var i=0, len=this.collections.length; i<len; i++) {
      collections.push(CMS.Collection.create(this.collections[i]));
    }
    this.collections = collections;
  }
});

CMS.ApplicationView = Ember.View.extend({});
CMS.ApplicationController = Ember.Controller.extend({
  currentAction: "Dashboard"
});

CMS.Router.map(function() {
  this.route("home", {path: "/"}),
  this.resource('collections', {path: '/collections/:collection_id'}, function() {
    this.route('new');
  });
});

CMS.HomeRoute = Ember.Route.extend({
  model: function() { return CMS.config; }
});

CMS.Collection = Ember.Object.extend({
  init: function() {
    this.id = this.slug;
    var fields = [];
    for (var i=0, len=this.fields.length; i<len; i++) {
      fields.push(CMS.Field.create(this.fields[i]));
    }
    this.fields = fields;
  }
});
CMS.Collection.reopenClass({
  find: function(id) {
    return CMS.config.collections.filter(function(c) { return c.id == id})[0];
  }
});

CMS.Field = Ember.Object.extend({value: null});

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

CMS.CmsListComponent = Ember.Component.extend({
  tagName: "ul",
  classNames: ["cms-list"],
  _itemId: 0,
  _newItem: function(value) {
    var item = {id: ++this._itemId, fields: []},
        field = null,
        fields = this.field.get("fields");

    for (var i=0; i<fields.length; i++) {
      var field  = $.extend(true, {}, fields[i]);
      field.value = value && value[fields[i].name];
      item.fields.push(CMS.Field.create(field));
    }
    return item;
  },
  
  init: function() {
    this._super.apply(this, arguments);
    var items = this.get("field.value");
    var newItems = Ember.A();
    if (items && items.length) {
      for (var i=0; i<items.length; i++) {
        newItems.pushObject(this._newItem(items[i]));
      }
      this.set("field.value", newItems);
    } else {
      newItems.pushObject(this._newItem());
      this.set("field.value", newItems);
    }
  },

  didInsertElement: function() {
    this.$().sortable({
      onDrop: function($item, container, _super) {
        _super($item, container);
        var items = this.get("field.value");
        var newItems = Ember.A();
        var itemLookup = {};
        for (var i=0, len=items.length; i<len; i++) {
          itemLookup[items[i].id] = items[i]
        }
        this.$().children(".cms-list-item").each(function() {
          newItems.push(itemLookup[$(this).data("item")]);
        });
        this.set("field.value", newItems);
      }.bind(this)
    });
  },

  _moveItem: function(item, direction) {
    var item, swapWith, index;
    var items = this.get("field.value");
    for (var i=0; i<items.length; i++) {
      if (items[i].id == item.id) {
        swapWith = items[i+direction];
        item   = items[i];
        index  = i;
        break;
      }
    }
    if (swapWith) {
      if (direction < 0 ) {
        items.replace(index-1, 2, [item, swapWith]);
      } else {
        items.replace(index, 2, [swapWith, item]);
      }
      
    }
  },
  actions: {
    addItem: function() {
      this.get("field.value").pushObject(this._newItem());
    },
    removeItem: function(item) {
      this.set("field.value", this.get("field.value").reject(function(i) { return i.id == item.id; }));
    },
    moveUp: function(item) {
      this._moveItem(item, -1);
    },
    moveDown: function(item) {
      this._moveItem(item, 1);
    }
  }
});

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

      if (this.get("linkUrl")) {
        this.set("value", before + link + after);
        selection.end = selection.start + link.end;
      }
      this.set("showLinkbox", false);
      this.set("linkUrl", null);
      this._setSelection(selection);
      this._currentSelection = null;
    }
  }
});