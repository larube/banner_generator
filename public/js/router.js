define(['views/index', 'views/banner', 'views/customImageBanner'], function(IndexView, BannerView, CustomImageBannerView){

	var ThreeAIncRouter = Backbone.Router.extend({

		currentView : null,

		routes : { 
			"index" 			: "index",
			"banner" 			: "banner",
			"customImageBanner" 	: "customBanner"
		},

		changeView : function(view){
			if(this.currentView !=null){
				this.currentView.undelegateEvents();
			}
			this.currentView = view;
			this.currentView.render();
		},

		/*index: function(){
			this.changeView(new IndexView());
		},*/

		banner: function(){
			this.changeView(new BannerView());
		},

		customBanner: function(){
			this.changeView(new CustomImageBannerView());
		}
	});

	return new ThreeAIncRouter;

});