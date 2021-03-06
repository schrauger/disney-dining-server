Dining.module('Searches.Views', function(Views, App, Backbone, Marionette, $, _) {

  // Searches View
  // --------------

  Views.SearchView = Marionette.ItemView.extend({
    template: Templates.diningSearch,
    tagName: "a",
    className: "list-group-item",
    events: {
      "click .fa-history"   : "showHistory",
      "click"               : "editSearch"
    },

    modelEvents: {
      'change': 'fieldsChanged'
    },

    initialize: function() {
      //if (this.model.get("id")) this.model.set({uuid: this.model.get("id")});
      this.justUpdated = false;
    },

    fieldsChanged: function() {
      this.clearTimeout();
      this.justUpdated = true;
      this.render();
    },

    clearTimeout: function() {
      console.log("clearing timeout");
      clearTimeout(this.timeout);
    },

    onRender: function(e) {
      var view = this,
          millis = (!this.model.get("past")) ? 30000 : 3600000;
      this.timeout = setTimeout(
        function() {
          view.render();
          console.log("Rendering:", view.model.get("restaurant").get("name"));
        },
        millis
      );
    },

    onShow: function(e) {
      if (this.model.get("over")) {
       this.$el.css("background-color", "rgb(252, 241, 241)");
      }

    },

    editSearch: function(e) {
      var entities = JSON.stringify({
            "name": this.model.get("restaurant").get("name"),
            "id": this.model.get("restaurant").get("id"),
            "secondary": this.model.get("restaurant").get("secondary")
          }),
          secondaryEntities;
      this.model.set({"entities": he.encode(entities)});
      if (typeof this.model.get("restaurant").get("secondary") !== "boolean") {
        secondaryEntities = JSON.stringify({
          "name": this.model.get("secondary").get("name"),
          "id": this.model.get("secondary").get("id")
        });
        this.model.set({"secondaryEntities": he.encode(secondaryEntities)});
      }
      var searchModal = new Views.SearchModal({model: this.model});
      App.layoutView.modal.show(searchModal);
    },

    updateSearch: function(e) {
      var view = this,
          errors = this.form.commit();
      if (typeof errors === 'undefined') {
        $(".update", this.$el).attr("disabled", "disabled");
        this.model.save(
          {},
          {
            success: function(model, response, options) {
              var restaurant = model.get("restaurant");
              Dining.fixTime(model);
              Messenger().post("Dining Search for "+restaurant+" has been updated.");
              $(".update", view.$el).removeAttr("disabled");
            },
            error: function(model, xhr, options) {
              if (view.$el.find('.alert').length > 0) { view.$el.find('.alert').remove(); }
              view.$el.find('.page-header').before('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>There has been a error trying to create this search. This is what the server told me: <strong>'+xhr.responseJSON.messsage.detail+'</strong></div>');
              $(".update", view.$el).removeAttr("disabled");
              $('html, body').animate({
                scrollTop: $(".alert-dismissable").offset().top-70
              }, 2000);

            }
          }
        );
      } else {
        var errorList = "",
            i = 0;
        _.each(errors, function(value, key, list) {
          errorList += (i > 0) ? ", " : "";
          errorList += key.capitalize();
          i++;
        });
        $('html, body').animate({
            scrollTop: $(".control-group.error").first().offset().top - 100
        }, 2000);
        Messenger().post({
          message: "You have errors that you must correct. You have issues with the following: "+errorList+".",
          type: "error"
        });
      }
    },

    showHistory: function(e) {
      e.stopImmediatePropagation();
      var test = this;
    },

    onBeforeDestroy: function(){
      this.clearTimeout();
    }
  });

  Views.NoSearchesView = Marionette.ItemView.extend({
    template: Templates.noSearchesView,
    className: "col-xs-12"
  });


  Views.SearchesView = Marionette.CompositeView.extend({
    template: Templates.searchesView,
    childView : Views.SearchView,
    childViewContainer: "#searches",
    emptyView: Views.NoSearchesView,
    className: "row",
    events: {
      "click .btn-add"          : "showAddSearch",
      "click .addSearchLink"    : "showAddSearch",
      "keyup #search"           : "filterSearches",
      "click .clearer"          : "clearerOnClick",
      "keyup .hasclear"         : "hasClearKeyUp",
      "click .activationEmail"  : "sendActivationEmail"
    },
    collectionEvents: {
      "add": "modelAdded"
    },
    initialize: function() {
      var test = $(this.el),
          view = this;

      App.vent.on('searches:showAlert', function (model) {
        view.showAlert(model);
      });
      
      App.vent.on('searches:add', function (model) {
        view.modelAdded(model);
      });
      
      App.vent.on('searches:delete', function (model) {
        view.modelDeleted(model);
      });

      App.vent.on('user:update', function (model) {
        if (Dining.user.get("availableSearches") <= 0) {
          $(".btn-add").attr("disabled", "disabled");
        } else {
          $(".btn-add").removeAttr("disabled");
        }
      });
    },

    onRender: function() {
      var view = this;

      this.timeout = setTimeout(
        function() {
          view.collection.sort();
          console.log("Refreshing sort order");
        },
        60000
      );

      if (App.user.get("subExpires") === null || moment(App.user.get("subExpires")).isBefore()) {
        $('.adunit', this.$el).dfp({
          dfpID:'177812472',
          enableSingleRequest: false,
          sizeMapping: {
            'my-default': [
              {browser: [1024, 400], ad_sizes: [970, 90] },
              {browser: [764, 300], ad_sizes: [728, 90] },
              {browser: [480, 300], ad_sizes: [468, 60] },
              {browser: [360, 200], ad_sizes: [320, 50] },
              {browser: [1, 1], ad_sizes: [300, 100]},
            ],
          },
          afterEachAdLoaded: function (e) {
            var adUnit = $(e);
            var refreshTimeOut = adUnit.data('refresh');
            var adUnitData = adUnit.data('googleAdUnit');
            if (adUnitData && adUnit.hasClass('display-block')) {
              console.log('setting timeout of 60000 to ' + adUnit.attr('id'));

              setTimeout(function () {
                  console.log('refreshing ' + adUnit.attr('id'));
                  window.googletag.pubads().refresh([adUnitData]);
              }, 60000);
            }
          }
        });
      } else {
        $('.adunit', this.$el).hide();
      }
    },

    onShow: function(e) {
      var view = this;
      $(".clearer").hide();
      if (!this.model.get("activated")) {
        var alertModel = new App.Models.AlertModel({
              'message': 'Please finalize your account activation by clicking on the "Complete Activation" button in your account activation email. If that email does not arrive in your inbox please check your spam folder and add noreply@disneydining.io to your address book. <a href="#" class="alert-link activationEmail">Click to resend message.</a>',
              'class': 'alert-danger'
            });
        this.showAlert(alertModel);
      }

      if (Dining.user.get("availableSearches") <= 0) {
        $(".btn-add").attr("disabled", "disabled");
      }
    },

    clearerOnClick: function(e) {
      $(".hasclear", this.$el).val('').focus();
      $(".clearer", this.$el).hide();
      this.filterSearches(e);
    },

    hasClearKeyUp: function(e) {
      var t = $(".clearer", this.$el);
      t.toggle(Boolean($(".hasclear", this.$el).val()));
    },

    showAddSearch: function(e) {
      this.newSearch = new App.Models.Search();
      var searchModal = new Views.SearchModal({model: this.newSearch, collection: this.collection});
      App.layoutView.modal.show(searchModal);
      //searches.add(search);
    },

    filterSearches: function(e) {
      var qry = $("#search", this.$el).val().toLowerCase(),
          filterSearchFn = function(search) {
            return search.get('restaurant').get('name').toLowerCase().indexOf(qry) > -1;
          },
          filtered = (qry === "") ? App.user.get('searches').models : filteredCollection(App.user.get('searches'), filterSearchFn);
      this.collection.reset(filtered);
    },

    modelAdded: function(model) {
      this.collection.add(model);
    },
    
    modelDeleted: function(model) {
      this.collection.remove(model);
    },

    refreshModel: function(data) {
      var results = this.collection.findWhere({uid: data.uid});
      results.fetch({
        success: function(model, response, options)  {
          Dining.fixTime(model);
        }
      });
    },

    showAlert: function(model) {
      var alert = new App.Public.Views.AlertView({model: model});
      $(".alert", this.$el).remove();
      alert.render();
      if ("error" in model) {
        $("input", this.$el).removeClass(model.get("class"));
        $("#"+model.get("error"), this.$el).addClass(model.get("class"));
      }
      $(alert.$el).prependTo(".bootcards-list", this.$el);
      if ($(window).scrollTop() > 0) {
        var offset = ($(".alert").offset().top-70 < 0) ? 0 : $(".alert").offset().top-70;
        $('html, body').animate({
          scrollTop: offset
        }, 2000);
      }
    },

    sendActivationEmail: function(e) {
      var view = this;
      $.ajax({
        url: '/api/user/activation/send',
        type: 'GET',
        error: function() {
            callback();
        },
        success: function(res) {
          var alertModel = new App.Models.AlertModel({
                'message': 'An activation email has been sent to your email address. If that email does not arrive in your inbox please check your spam folder and add noreply@disneydining.io to your address book.',
                'class': 'alert-info'
              });
          view.showAlert(alertModel);
        }
      });

    },

    clearTimeout: function() {
      console.log("clearing timeout");
      clearTimeout(this.timeout);
    },

    onBeforeDestroy: function(){
      this.clearTimeout();
    }

  });

  Views.SearchModal = Backbone.Modal.extend({
    template: Templates.addSearchForm,
    submitEl: '.btn-save',
    cancelEl: '.btn-close',
    events: {
      "click .btn-delete"    : "deleteSearch",
    },
    initialize: function(options) {
      _.extend(this, _.pick(options, "collection"));
    },
    onShow: function() {
      var view = this;
      $('#date', this.$el).pickadate({
        container: 'body',
        format: 'dddd, mmm dd, yyyy',
        formatSubmit: 'yyyy-mm-dd',
        min: [moment().year(),moment().month(),moment().date()],
        selectYears: true,
        selectMonths: true
      });
      $('#time', this.$el).pickatime({
        container: 'body',
        disable: [
          0, 1, 2, 3, 4, 5, 23, 24
        ]
      });
      $("#partySize", this.$el).TouchSpin({
          min: 1,
          max: 50,
          step: 1,
          boostat: 5,
          maxboostedstep: 5,
      });

      this.selectize = $('#restaurant', this.$el).selectize({
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        dataAttr: 'data-data',
        create: false,
        render: {
          option: function(item, escape) {
            return '<div>' +
                '<span class="title">' +
                    '<span class="name"></i>' + escape(item.name) + '</span>' +
                '</span>' +
            '</div>';
          }
        },
        load: function(query, callback) {
          if (!query.length) { return callback(); }
          $.ajax({
            url: '/api/search/restaurants/' + encodeURIComponent(query),
            type: 'GET',
            error: function() {
                callback();
            },
            success: function(res) {
                callback(res);
            }
          });
        },
        onItemAdd: function(value, $item) {
          if (this.options[value].secondary) {
            $(".packageRestaurant", view.$el).show();
          } else {
            $(".packageRestaurant", view.$el).hide();
            var $select = view.secondarySelectize,
                control = $select[0].selectize;
            control.clear();
          }
        }
      });

      this.secondarySelectize = $('#secondary', this.$el).selectize({
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        dataAttr: 'data-data',
        create: false,
        render: {
          option: function(item, escape) {
            return '<div>' +
                '<span class="title">' +
                    '<span class="name"></i>' + escape(item.name) + '</span>' +
                '</span>' +
            '</div>';
          }
        },
        load: function(query, callback) {
          if (!query.length) { return callback(); }
          $.ajax({
            url: '/api/search/restaurants/' + encodeURIComponent(query),
            type: 'GET',
            error: function() {
                callback();
            },
            success: function(res) {
                callback(res);
            }
          });
        }
      });
      if (this.model.get("over")) {
        if (this.$el.find('.alert').length > 0) { this.$el.find('.alert').remove(); }
        this.$el.find('.modal-body').prepend('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>This search is outside the Disney 180 limit. It will not be searched until it is within 180 days.</strong></div>');
      }

      if (this.model.get("restaurant").get("secondary")) {
        $(".packageRestaurant", view.$el).show();
      }
    },
    showAlert: function(model) {
      var alert = new App.Public.Views.AlertView({model: model});
      $(".alert", this.$el).remove();
      alert.render();
      if ("error" in model.attributes) {
        $("#"+model.get("error"), this.$el).parent().removeClass("has-error");
        $("#"+model.get("error"), this.$el).parent().addClass("has-error");
      }
      $(alert.$el).prependTo(".modal-body", this.$el);
      /**

      if ($(window).scrollTop() > 0) {
        var offset = ($(".alert").offset().top-70 < 0) ? 0 : $(".alert").offset().top-70;
        $('html, body').animate({
          scrollTop: offset
        }, 2000);
      }
      **/
    },
    beforeSubmit: function(e) {
      var d = moment($("#date", this.$el).val()).format("YYYY-MM-DD"),
          t = moment($("#time", this.$el).val(), "h:mm A").format("HH:mm:ss"),
          dateTime = moment.tz(d + " " + t, "America/New_York"),
          isThisNew = (this.model.get("uid") === "") ? true : false,
          modal = this,
          changedAttributes = this.model.changedAttributes();
      this.model.set({
        "restaurantId": $("#restaurant", this.$el).val(),
        "secondaryId": $("#secondary", this.$el).val(),
        "partySize": $("#partySize", this.$el).val(),
        "date": moment(dateTime).tz("UTC").format("YYYY-MM-DDTHH:mm:ss") + ".000Z",
        "user": App.user.get("id")
      });
      if (this.model.isValid()) {
        return true;
      } else {
        var model = new App.Models.AlertModel(this.model.validationError);
        this.showAlert(model);
        return false;
      }
    },
    submit: function(e) {
      this.model.save(
        {},
        {
          success: function(model, response, options) {
            var restaurant = model.get("restaurant").get("name"),
                message = "Dining Search for " + restaurant + " has been";
            Dining.fixTime(model);
            var searches = App.user.get('searches'),
                s = searches.findWhere({id: model.id});
            if (typeof s === "undefined") {
              message += " created.";
              searches.add(model);
              if (modal.collection) {
                modal.collection.add(model);
              }
              App.vent.trigger("searches:add", model);
            } else {
              message += " updated.";
            }
            Messenger().post(message);
            Dining.updateUserModel();
          },
          error: function(error) {
            var test = error;
          }
        }
      );
    },

    deleteSearch: function(e) {
      var modal = this;
      this.model.destroy(
        {
          success: function(model, response, options) {
            modal.close();
            Dining.updateUserModel();
          },
          error: function(error) {
            modal.close();
            Dining.updateUserModel();
          }
        }
      );
    }
  });

  Views.AccountSettingsView = Marionette.ItemView.extend({
      template: Templates.accountSettings,
      events: {
        "click .update-profile"    : "updateProfile"
      },
      initialize: function(){
        this.model.schema = {
          title:      {
            type: 'Select',
            options: [
              { val: false, label: 'Select a title' },
              { val: 'Mr', label: 'Mr' },
              { val: 'Mrs', label: 'Mrs' },
              { val: 'Ms', label: 'Ms' }
            ],
            editorClass: 'form-control'
          },
          firstName:  { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          lastName:   { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          street1:    { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          street2:    { type: 'Text', editorClass: 'form-control' },
          city:       { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          state:      { type: 'Select', options: App.Users.states, validators: ['required'], editorClass: 'form-control' },
          zipCode:    { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          phone:      { type: 'Text', validators: ['required'], editorClass: 'form-control' },
          email:      { validators: ['required', 'email'], editorClass: 'form-control' }
        };
      },

      onRender: function() {
        var submit = "<div class='form-group'><button type=\"submit\" class=\"btn btn-default update-profile\">Update Profile</button></div>";
        this.form = new Backbone.Form({
            model: this.model
        }).render();

        this.$el.find("#accountSettingsMain").append(this.form.el).append(submit);
        this.$el.find('#c2_phone').mask('(000) 000-0000');
      },

      updateProfile: function(e) {
        var view = this;
        if (typeof this.form.commit() === 'undefined') {
          this.model.save(
            {},
            {
              success: function(model, response, options) {
                  $('.page-header').before('<div class="alert alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Your profile has been updated.</strong></div>');
                  $('html, body').animate({
                    scrollTop: $(".alert-dismissable").offset().top-70
                  }, 2000);
              },
              error: function(model, xhr, options) {
                if ($('.alert').length > 0) { $('.alert').remove(); }
                $('.page-header').before('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>There has been a error trying to create your user. This is what the server told me: <strong>'+xhr.responseJSON.messsage.detail+'</strong></div>');
                $('html, body').animate({
                  scrollTop: $(".alert-dismissable").offset().top-70
                }, 2000);
              }
            }
          );
        }
      }
  });


  // Application Event Handlers
  // --------------------------


});
