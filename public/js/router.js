define(['views/index', 'views/footerScrapping', 'views/footerCustomImage', 'views/headerCustomImage', 'views/overslideCustomImage', 'theme'], function(IndexView, FooterScrappingView, FooterCustomImageView, HeaderCustomImageView, OverslideCustomImageView, theme){

	var ThreeAIncRouter = Backbone.Router.extend({

		currentView : null,

		routes : { 
			"index" 				: "index",
			"footer-scrapping" 			: "footerScrapping",
			"footer-custom-image" 		: "customImageFooter",
			"header-custom-image"		: "customImageHeader",
			"overslide-custom-image"		: "customImageOverslide"
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

		footerScrapping: function(){
			this.changeView(new FooterScrappingView());
		},

		customImageFooter: function(){
			this.changeView(new FooterCustomImageView());
		},

		customImageHeader : function(){
			this.changeView(new HeaderCustomImageView());
		},

		customImageOverslide : function(){
			this.changeView(new OverslideCustomImageView());	
		}

	});

	return new ThreeAIncRouter;

});