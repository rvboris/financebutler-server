var authom = require('authom');

module.exports = function(app) {
	authom.createServer({
		service: "google",
		id: "813214877477.apps.googleusercontent.com",
		secret: "r6mvJb7vCBAH9XsV9B0dNkwT"
	});

	authom.on('auth', function(req, res, data) {
		console.log(data);
		res.send(
			"<html>" +
			"<body>" +
			"<div style='font: 300% sans-serif'>You are " + data.id + " on " + data.service + ".</div>" +
			"<pre><code>" + JSON.stringify(data, null, 2) + "</code></pre>" +
			"</body>" +
			"</html>");
	});

	authom.on('error', function(req, res, data) {
		// called when an error occurs during authentication
	});

	app.get("/auth/:service", authom.app)
};