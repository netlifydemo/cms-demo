"use strict";

var Promise = Ember.RSVP.Promise;

window.CMS = Ember.Application.create();
CMS.deferReadiness();
$.get("config.yml").then(function(data) {
  CMS.config = CMS.Config.create(jsyaml.safeLoad(data));
  CMS.Repository.configure(CMS.config);
  var token = localStorage.getItem("cms.token");
  if (token) {
    CMS.Repository.setToken(token);
    CMS.loggedIn = true;
  }
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

CMS.Repository = (function() {
  var base, branch;
  var ENDPOINT = "https://api.github.com/";
  var token = null;

  function request(url, settings) {
    return $.ajax(url, $.extend(true, {headers: {Authorization: "Bearer " + token}, contentType: "application/json"}, settings || {}));
  };

  function getBranch() {
    return request(base+ "/branches/" + branch);
  };

  function getTree(sha) {
    return sha ? request(base + "/git/trees/" + sha) : new Promise(function(resolve) { resolve({tree: []})});
  };

  function uploadBlob(file) {
    return new Promise(function(resolve, reject) {
      request(base + "/git/blobs", {
        type: "POST",
        data: JSON.stringify({
          content: file.base64 ? file.base64() : Base64.encode(file.content),
          encoding: "base64"
        })
      }).then(function(response) {
        file.sha = response.sha;
        resolve(file);
      }, function(err) {
        reject(err);
      });
    });
  };

  function updateTree(sha, path, fileTree) {
    return new Promise(function(resolve, reject) {
      console.log("Getting tree %o", sha);
      getTree(sha).then(function(tree) {
        var obj, filename, fileOrDir;
        var updates = [];
        console.log("Got tree %o for sha %o", tree, sha);
        for (var i=0, len=tree.tree.length; i<len; i++) {
          obj = tree.tree[i];
          if (fileOrDir = fileTree[obj.path]) {
            if (fileOrDir.file) {
              fileOrDir._added = true;
              updates.push(
                fileOrDir.file ?
                  {path: obj.path, mode: obj.mode, type: obj.type, sha: fileOrDir.sha} :
                  updateTree(obj.sha, obj.path, fileOrDir)
              );  
            } else {
              updates.push(updateTree(obj.sha, obj.path, fileOrDir));
            }
          }
        }
        for (filename in fileTree) {
          fileOrDir = fileTree[filename];
          if (fileOrDir._added) { continue; }
          updates.push(
            fileOrDir.file ?
              {path: filename, mode: "100644", type: "blob", sha: fileOrDir.sha} :
              updateTree(null, filename, fileOrDir)
          );
        }
        console.log("Updates: %o", updates);
        Promise.all(updates).then(function(updates) {
          request(base + "/git/trees", {
            type: "POST",
            data: JSON.stringify({base_tree: sha, tree: updates})
          }).then(function(response) {
            resolve({path: path, mode: "040000", type: "tree", sha: response.sha});
          }, function(err) {
            reject(err);
          })
        });
      }, function(err) { reject(err); })
    });
  };

  return {
    configure: function(config) { 
      base = ENDPOINT + "repos/" + config.repo;
      branch = config.branch;
    },
    setToken: function(newToken) { token = newToken; },
    readFile: function(path) {
      return request(base + "/contents/" + path, {
        headers: {Accept: "application/vnd.github.VERSION.raw"},
        data: {ref: branch}
      });
    },
    updateFiles: function(options) {
      return new Promise(function(resolve, reject) {
        var file, filename, part, parts, subtree;
        var fileTree = {};
        var files = [];
        for (var i=0, len=options.files.length; i<len; i++) {
          file = options.files[i];
          files.push(file.upload ? file : uploadBlob(file));
          parts = file.path.split("/").filter(function(part) { return part; });
          filename = parts.pop();
          subtree = fileTree;
          while (part = parts.shift()) {
            subtree[part] = subtree[part] || {}
            subtree = subtree[part];
          }
          subtree[filename] = file;
          file.file = true;
        }
        Promise.all(files).then(function() {
          getBranch().then(function(branchData) { 
            updateTree(branchData.commit.sha, "/", fileTree).then(function(changeTree) {
              request(base + "/git/commits", {
                type: "POST",
                data: JSON.stringify({message: options.message, tree: changeTree.sha, parents: [branchData.commit.sha]})
              }).then(function(response) {
                request(base + "/git/refs/heads/" + branch, {
                  type: "PATCH",
                  data: JSON.stringify({sha: response.sha})
                }).then(function(ref) {
                  resolve(ref);
                }, function(err) { reject(err); });
              }, function(err) { reject(err); });
            }, function(err) { reject(err); });
          }, function(err) { reject(err); });
        }, function(err) { reject(err); });
      });
    }
  }
})();

CMS.ApplicationController = Ember.Controller.extend({
  currentAction: "Dashboard"
});

CMS.Router.map(function() {
  this.route("login"),
  this.route("logout"),
  this.route("home", {path: "/"}),
  this.route("create", {path: "/collections/:collection_id"}),
  this.route("edit", {path: "/collections/:collection_id/:slug"})
});

CMS.LogoutRoute = Ember.Route.extend({
  activate: function() {
    CMS.loggedIn = false;
    CMS.Repository.setToken(null);
  }
});

CMS.LoginController = Ember.Controller.extend({
 actions: {
    login: function() {
      netlify.configure({site_id: 'timespace.netlify.com'});
      netlify.authenticate({provider: "github", scope: "repo"}, function(err, data) {
        if (err) {
          this.controller.set("error", err);
          console.log(this);
        } else {
          localStorage.setItem("cms.token", data.token);
          CMS.Repository.setToken(data.token);
          CMS.loggedIn = true
          this.transitionToRoute("home");
        }
      }.bind(this));
    }
  }
})

CMS.AuthenticatedRoute = Ember.Route.extend({
  activate: function() {
    if (!CMS.loggedIn) {
      this.transitionTo("login");
    }
  }
})

CMS.HomeRoute = CMS.AuthenticatedRoute.extend({
  model: function() { return CMS.config; }
});

CMS.CreateRoute = CMS.AuthenticatedRoute.extend({});
CMS.EditRoute = CMS.AuthenticatedRoute.extend({
  model: function(params) {
    return CMS.Entry.find(params.collection_id, params.slug);
  }
});
CMS.EditController = Ember.Controller.extend({
  _filePath: function() {
    return this.get("collection").folder + "/" + this.model.slug + ".md";
  },
  collection: function() {
    return this.get("model._collection");
  }.property("model._collection"),
  actions: {
    save: function() {
      var content = this.model.generateContent();
      CMS.Repository.updateFiles({
        files: [{path: this.model._path, content: content}],
        message: "Updated " + this.get("collection").label + " " + this.model.title
      }).then(function() {
        console.log("Done!");
      })
    }
  }
});

CMS.CreateController = Ember.Controller.extend({
  actions: {
    save: function() {

    }
  }
});

CMS.Collection = Ember.Object.extend({
  init: function() {
    this.id = this.slug;
    var fields = [];
    for (var i=0, len=this.fields.length; i<len; i++) {
      fields.push(CMS.Field.create(this.fields[i]));
    }
    this.fields = fields;
  },
  setEntry: function(entry) {
    this.entry = entry;
    for (var i=0, len=this.fields.length; i<len; i++) {
      this.fields[i].set("value", entry[this.fields[i].name]);
    }
  }
});
CMS.Collection.reopenClass({
  find: function(id) {
    return CMS.config.collections.filter(function(c) { return c.id == id})[0];
  }
});

CMS.Entry = Ember.Object.extend({
  _collection: null,
  generateContent: function() {
    var field;
    var content = "---\n";
    var meta = {};
    for (var i=0, len=this._collection.fields.length; i<len; i++) {
      field = this._collection.fields[i];
      if (field.name !== "body") {
        meta[field.name] = field.getValue()
      }
      this[field.name] = field.getValue();
    }
    console.log("Got meta: %o", meta);
    content += jsyaml.safeDump(meta);
    content += "---\n\n";
    content += this.body;
    return content;
  },
});
CMS.Entry.reopenClass({
  pathFor: function(collection, slug) {
    return collection.folder + "/" + slug + ".md";
  },
  parseContent: function(content) {
    var regexp = /^---\n([^]*?)\n---\n([^]*)$/;
    var match = content.match(regexp);
    var item = jsyaml.safeLoad(match[1]);
    item.body = (match[2] || "").replace(/^\n+/, '');
    return item;
  },
  find: function(collection_id, slug) {
    var collection = CMS.Collection.find(collection_id);
    return new Promise(function(resolve, reject){
      var path = CMS.Entry.pathFor(collection, slug);
      CMS.Repository.readFile(path).then(function(content) {
        var entry = CMS.Entry.create($.extend(CMS.Entry.parseContent(content), {_collection: collection, _path: path}));
        collection.setEntry(entry);
        resolve(entry);
      }.bind(this));
    })
  }
});

CMS.Field = Ember.Object.extend({
  value: null,
  getValue: function() {
    return this.get("value");
  }
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
  }.observes("value"),

  didInsertElement: function() {
    this.valueChanged();
  }
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
    var field = this.get("field");
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
    field.getValue = function() {
      var obj, field, fields;
      var items = [];
      var value = this.get("value") || [];
      for (var i=0, len=value.length; i<len; i++) {
        obj = {};
        fields = value[i].fields;
        for (var j=0; j<fields.length; j++) {
          obj[fields[j].name] = fields[j].getValue();
        }
        if (!Object.keys(obj).every(function(key) { return obj[key] == null; })) {
          items.push(obj);
        }
      }
      return items;
    }
  },

  didInsertElement: function() {
    this.$().sortable({
      placeholder: "<li class='cms-list-placeholder'/>",
      itemSelector: ".cms-list-item",
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
      }.bind(this),
      afterMove: function($placeholder, container, $closestItemOrContainer) {
        var css = {
          height: $closestItemOrContainer.height(),
          width: $closestItemOrContainer.width(),
        };
        $placeholder.css(css);
      }
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