require.config({

	paths : {
		jQuery  		: '/js/libs/jquery',
		Underscore 		: '/js/libs/underscore',
		underscore 		: '/js/libs/underscore',
		Backbone 		: '/js/libs/backbone',
		Handlebars 		: '/js/libs/Handlebars',
		hbs 			: '/js/libs/hbs',
		jqueryForm 		: '/js/libs/jquery.form',
		templates		:'../templates',
		ThreeAIncView 	: '/js/ThreeAIncView',
		bootStrap 		: '/js/libs/bootstrap.min',
		select2 		: '/js/libs/select2.min',
		uniform 		: '/js/libs/jquery.uniform.min',
		utf8 			: '/js/libs/utf8',
		theme 			: '/js/libs/theme'
	},

	shim :{
		'Backbone':['Underscore', 'jQuery'],
		'ThreeAInc' : ['Backbone'],
		'ThreeAIncView' : ['Backbone'],
		'jQuery': {exports: '$'},
		'underscore': {exports: '_'}
	}

	
});

require(['ThreeAInc', 'ThreeAIncView'], function(ThreeAInc,ThreeAIncView){
	ThreeAInc.initialize();
	ThreeAIncView.initialize();
});