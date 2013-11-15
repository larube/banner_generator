define(['views/index', 'views/banner'], function(IndexView, BannerView){

	var ThreeAIncRouter = Backbone.Router.extend({

		currentView : null,

		routes : { 
			"index" 		: "index",
			"banner" 	: "banner"
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
		}
	});

	return new ThreeAIncRouter;

});