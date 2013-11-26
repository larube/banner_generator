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
		
		validateInputs : function(inputs){

			var error = false;

			inputs.each(function(i){
				var 	value 	= $(this).val(),
					regex 	= $(this).prop('pattern');

				var regex = new RegExp(regex);

				if(!regex.test(value) ) {
					$(this).closest('div.field-box').addClass('error');
					$(this).next('.alert-msg').fadeIn();
					error =  true;
				}
				
			});

			return error;
		},

		fadeOutErrors : function(evt){
				if($(evt.target).closest('.field-box').hasClass('error')){
						$(evt.target).closest('.field-box').removeClass('error');
						$(evt.target).next('.alert-msg').fadeOut();
					}
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