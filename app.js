Error.stackTraceLimit = Infinity;

var cluster = require('cluster'),
	http = require('http'),
	numCPUs = require('os').cpus().length,
	jsonStore = require('json-store'),
	path = require('path'),
	crypto = require('crypto'),
	express = require('express'),
	program = require('commander'),
	Log = require('log');

require('express-namespace');

var app = express();

app.configure('production', function() {
	app.set('log', new Log('error'));
});

app.configure('development', function() {
	app.set('log', new Log('info'));
});

program
	.option('-p, --port [port]', 'Port', parseInt)
	.option('-d, --drop', 'Drop database')
	.parse(process.argv);

app.set('program', program);
app.set('config', jsonStore(__dirname + path.sep + 'config.json'));

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		cluster.fork();
	});

	app.get('config').set('secret', crypto.randomBytes(16).toString('hex'));

	require(__dirname + path.sep + 'models' + path.sep + 'index.js')(app, cluster.isMaster);
} else {
	require(__dirname + path.sep + 'server.js')(app);
}