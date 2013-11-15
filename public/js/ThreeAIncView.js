define(function(require){
	var ThreeAIncView = Backbone.View.extend({
		requireLogin : true,

		initialize : function(){
			this.background = $('#backgroundAjaxRequest');
		},

		showAjaxBackground : function(){
			this.background.fadeIn();
		},

		hideAjaxBackground : function(){
			this.background.fadeOut();
		}
	});

	return ThreeAIncView;

});