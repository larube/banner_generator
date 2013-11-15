var 	express  	= require('express'),
	app 		= express(),
	nodemailer 	= require('nodemailer'),
	MemoryStore 	= require('connect').session.MemoryStore,
	mongoose 	= require('mongoose');
	dbPath 	= 'mongodb://localhost/numbate',
	fs 		= require('fs');
	hbs 		= require('hbs');

var config = {
	mail : require ('./config/mail')
};

var models  ={
	//Account 	: require('./models/Account')(config, mongoose, nodemailer)
};


app.configure(function(){
	app.set('view engine', 'hbs');
	app.locals({ layout: 'layout.hbs'});
	app.engine('hbs', require('hbs').__express);
	app.use(express.static(__dirname + '/public'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.limit('1000mb'));
	app.use(express.session({
					secret  	: "Numbate3ainc", 
					store 	: new MemoryStore
				}
	));
	mongoose.connect(dbPath, function onMongooseError(err){
		if(err){
			throw err;
		}
	});
});



fs.readdirSync('routes').forEach(function(file) {
	if ( file[0] == '.' ) return;
	var routeName = file.substr(0, file.indexOf('.'));
	require('./routes/' + routeName)(app, models);
});

hbs.registerHelper('campaigns', function(context, options) {
	var cells = [], html, k;
	for (k in context) {
			html = options.fn({
				name: context[k],
				value: context[name]
			}); 
			cells.push(html);
	}
	return cells.join('');
});

var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

app.get('/', function(req, res){
	//res.render('index', {layout : 'layout.hbs' });
	res.render('index');
});


app.listen(8080);