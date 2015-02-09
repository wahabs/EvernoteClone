App.Views.NoteEdit = Support.CompositeView.extend({
  template: JST["notes/note_edit"],

  initialize : function(options) {
    // expecting note model
    this.tags = options.tags;
    this.notebooks = options.notebooks;
    this.listenTo(this.model, 'sync', this.render);
    this.listenTo(this.model.tags(), 'add', this.render);
  },

  events: {
    "submit #note-edit" : "submitNote",
    "submit #tag-form" : "submitNote" // to prevent losing data in the editable
  },

  render : function() {
    var content = this.template({ note: this.model, notebooks: this.notebooks });
    this.$el.html(content);
    this.addTagForm();
    this.addTags();
    this.addEditable();
    return this;
  },

  addEditable : function() {
    var editables = aloha.dom.query('.editable', document).map(aloha);

    _(editables).each(function (editable) {
      for (var command in aloha.ui.commands) {
        this.$('.action-' + command).on(
          'click', aloha.ui.command(editable, aloha.ui.commands[command])
        );
      }
    })

    function middleware(event) {
      this.$('.active').removeClass('active');
      if ('leave' !== event.type) {
        var states = aloha.ui.states(aloha.ui.commands, event);
        for (var selector in states) {
          this.$('.action-' + selector).toggleClass('active', states[selector]);
        }
      }
      return event;
    }

    aloha.editor.stack.unshift(middleware);
  },

  addTagForm : function() {
    this.appendChild(new App.Views.TagForm({ model: this.model, collection: this.tags }));
  },

  addTags : function() {
    this.appendChildTo(new App.Views.TagsIndex({ collection: this.model.tags(), note: this.model }), ".note-tags");
  },

  submitNote : function(event) {
    event.preventDefault();
    var that = this;

    var formData = $(event.currentTarget).serializeJSON();
    that.model.set(formData);

    that.model.set({
      title: that.$('#title').text(),
      body: that.$('#body').html()
    });

    var notebook = this.notebooks.getOrFetch(that.model.get("notebook_id"));
    that.model.set("ord", notebook.notes().nextOrd());
    that.model.save({}, {
      success: function() {
        notebook.notes().add(that.model, { merge: true });
        // Backbone.history.navigate("notebooks/" + notebook.id, { trigger: true })
      }
    });
  }

})
