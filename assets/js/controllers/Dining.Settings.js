Dining.module('Settings', function(Settings, App, Backbone, Marionette, $, _) {

  // Edit Router
  // ---------------
  //
  // Handle routes to show the active vs complete todo items

  Settings.Router = Marionette.AppRouter.extend({
    appRoutes: {
      'user-profile'            : 'showUserProfile',
      'change-password'         : 'showChangePassword',
      'update-notifications'    : 'showNotifications',
      'payments'                : 'showPayments'
    }
  });

  // Settings Controller (Mediator)
  // ------------------------------
  //
  // Control the workflow and logic that exists at the application
  // level, above the implementation detail of views and models

  Settings.Controller = function() {};

  _.extend(Settings.Controller.prototype, {

    init: function() {
      /*
      if (typeof App.user == 'undefined') {
        Backbone.history.navigate("start", { trigger: true });
      } else {
        Backbone.history.navigate("searches", { trigger: true });
      }
      */
    },

    showUserProfile: function() {
      var view = new Settings.Views.UserProfileView({model: App.user});
      App.layoutView.main.show(view);
      App.vent.trigger("hideMenu");
    },

    showChangePassword: function() {
      var resetModel = new App.Models.PasswordReset(),
          view = new Settings.Views.ChangePasswordView({model: resetModel});
      App.layoutView.main.show(view);
      App.vent.trigger("hideMenu");
    },

    showNotifications: function() {
      var view = new Settings.Views.NotificationsView({model: App.user});
      App.layoutView.main.show(view);
      App.vent.trigger("hideMenu");
    },

    showPayments: function() {
      var view = new Settings.Views.PaymentsView({model: App.user});
      App.layoutView.main.show(view);
      App.vent.trigger("hideMenu");
    }

  });

  // Edit Initializer
  // --------------------
  //
  // Get the Edit up and running by initializing the mediator
  // when the the application is started.

  Dining.addInitializer(function() {

    var controller = new Settings.Controller();
    new Settings.Router({
      controller: controller
    });

  });

});
