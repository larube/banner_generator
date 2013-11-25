define(['hbs!templates/generator_custom_images_banners/customImageBanner', 'select2', 'uniform', 'utf8', 'jqueryForm', 'ThreeAIncView'], function(customImageBannerTemplate, select2, uniform, utf8, jqueryForm, ThreeAIncView){
	var CustomImageBannerView =Backbone.View.extend({
		el  		: $('#content'),

		events 		: {
			'submit #uploadImageBannerForm' : 'uploadCustomImage'
		},


		render : function(){
			$('#error').fadeOut();
			var self =this;
			ThreeAIncView.showAjaxBackground();
			$.ajax({
				
				url: '/getCampaigns',
				dataType: 'json'
				}).done(function(data) {
					ThreeAIncView.hideAjaxBackground();
					var campaigns=data;
					var out='';
					for (campaign in campaigns){
						out+="<option value="+campaigns[campaign].id+">"+utf8.decode(campaigns[campaign].name)+"</option>";
					}
					var templateConfig = {campaigns:out};
					self.$el.html(customImageBannerTemplate(templateConfig));
					ThreeAIncView.uniformSelect();
					self.$el.hide().fadeIn();
					
				}).error(function(){
					ThreeAIncView.hideAjaxBackground();
					self.showErrorMessage('Impossible de récupérer les campagnes, veuillez réessayer plus tard.');
				});

		},

		uploadCustomImage : function(evt){
			evt.preventDefault();
			ThreeAIncView.showAjaxBackground();
			
			var self = this;
			var options  = {
				data : {form:$(evt.target).serialize()},
				error: function(xhr) {
								ThreeAIncView.hideAjaxBackground();
								console.log(xhr.status);
							},
				success: function(res) {
								ThreeAIncView.hideAjaxBackground();
								console.log(res);
				}
			};
			$(evt.target).ajaxSubmit(options);
		}



	});

	return CustomImageBannerView;
});
				
