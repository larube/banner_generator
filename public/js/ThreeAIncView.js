define(function(require){
	var ThreeAIncView = Backbone.View.extend({
		requireLogin : true,

		el : $('#sidebar-nav'),

		events : {
			'click ul#dashboard-menu li' 				: 'showSelectedMenu',
		},

		initialize : function(){
			this.background 	= $('#backgroundAjaxRequest');
			this.menuApp	 	= $('#dashboard-menu');
		},

		showAjaxBackground : function(){
			this.background.fadeIn();
		},

		hideAjaxBackground : function(){
			this.background.fadeOut();
		},

		showSelectedMenu : function(evt){
			
			this.menuApp.find('div.pointer').remove();
			this.menuApp.find('li.active').removeClass('active');
			var li = $(evt.target).closest('li');
			li.addClass('active').prepend('<div class="pointer"><div class="arrow"></div><div class="arrow_border"></div></div>');
		},
		
		uniformSelect : function(){	
			$("input:checkbox, input:radio").uniform();
			$(".select2").select2({
				placeholder: ""
			});
		},
	});

	return new ThreeAIncView;

});