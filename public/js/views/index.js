define(['ThreeAIncView', 'hbs!templates/index']
	, function(ThreeAIncView,  indexTemplate){
	var indexView = ThreeAIncView.extend({
		el  		: $('#content'),


		events : {
			"submit form" : "updateStatus"
		},

		render 	:function(){
			this.$el.html(indexTemplate);
		}

	});

	return new indexView;
});