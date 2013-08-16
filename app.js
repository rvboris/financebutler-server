var cluster = require('cluster'),
	http = require('http'),
	numCPUs = require('os').cpus(),
	jsonStore = require('json-store'),
	path = require('path'),
	crypto = require('crypto'),
	express = require('express'),
	program = require('commander'),
	Log = require('log');

numCPUs = numCPUs.length === 1 ? 2 : numCPUs.length;

require('express-namespace');

program
	.option('-p, --port [port]', 'Port', parseInt)
	.option('-d, --drop', 'Drop database')
	.option('-db, --database [dbname]', 'Force database name')
	.option('-e, --env [env]', 'App environment')
	.parse(process.argv);

process.env.NODE_ENV = typeof process.env.NODE_ENV !== 'undefined' ? process.env.NODE_ENV : (program.env || 'development');
process.env.NODE_PORT = typeof process.env.NODE_PORT !== 'undefined' ? process.env.NODE_PORT : (program.port || 3000);

program.env = process.env.NODE_ENV;
program.port = parseInt(process.env.NODE_PORT, 10);

var app = express();

app.configure('production', function() {
	app.set('log', new Log('error'));
});

app.configure('development', function() {
	app.set('log', new Log('info'));
	Error.stackTraceLimit = Infinity;
});

app.set('program', program);
app.set('config', jsonStore(__dirname + path.sep + 'config.json'));

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		cluster.fork();
	});

	require(__dirname + path.sep + 'models' + path.sep + 'index.js')(app, cluster.isMaster);
} else {
	require(__dirname + path.sep + 'server.js')(app);
}