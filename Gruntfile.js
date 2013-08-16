var moment = require('moment');

module.exports = function(grunt) {

	var version = function() {
		return grunt.file.readJSON('package.json').version || '1.0.0';
	};

	var now = moment().format('HH-mm-ss-DD-MM-YYYY');
	var env = grunt.option('env') || 'development';

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-sftp-deploy');
	grunt.loadNpmTasks('grunt-ssh');
	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-hub');

	grunt.initConfig({
		deploy: grunt.file.readJSON('deploy/settings.json'),

		clean: {
			build: [
				'public/*',
				'deploy/*.zip'
			]
		},

		hub: {
			build: {
				src: ['frontend/Gruntfile.js'],
				tasks: ['build'],
			},
		},

		compress: {
			main: {
				options: {
					archive: 'deploy/<%= deploy.' + env + '.host %>-' + version() + '.zip'
				},
				files: [
					{
						src: [
							'public/**/*',
							'models/**/*',
							'routes/**/*',
							'system/**/*',
							'./app.js',
							'./server.js',
							'./*.json'
						],
						dest: '/'
					}
				]
			}
		},

		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: [],
				commit: false,
				push: false,
				createTag: false
			}
		},

		'sftp-deploy': {
			main: {
				auth: {
					host: '<%= deploy.' + env + '.host %>',
					authKey: 'main'
				},
				src: 'deploy',
				dest: '/tmp',
				exclusions: ['deploy/*.json', 'deploy/*.pem'],
				server_sep: '/'
			}
		},

		sshexec: {
			prepare: {
				command: 'mkdir -p <%= deploy.' + env + '.root %>/releases/' + version() + ' && ' +
						 'mkdir -p <%= deploy.' + env + '.root %>/current-tmp/ && ' +
						 'cp -r <%= deploy.' + env + '.root %>/current/* <%= deploy.' + env + '.root %>/current-tmp/ && ' +
						 'unzip /tmp/<%= deploy.' + env + '.host %>-' + version() + '.zip -d <%= deploy.' + env + '.root %>/releases/' + version() + ' && ' +
						 'cd <%= deploy.' + env + '.root %>/releases/' + version() + ' && ' + 
						 '. ~/nvm/nvm.sh && npm install --silent',
				options: {
					host: '<%= deploy.' + env + '.host %>',
					username: '<%= deploy.' + env + '.username %>',
					privateKey: grunt.file.read('deploy/key.pem')
				}
			},
			deploy: {
				command: 'supervisorctl stop ' + (env === 'development' ? 'dev-' : '') + 'financebutler && ' + 
						 'supervisorctl start ' + (env === 'development' ? 'dev-' : '') + 'financebutler-support && ' + 
						 'rm -r <%= deploy.' + env + '.root %>/current/ && ' + 
						 'mkdir -p <%= deploy.' + env + '.root %>/current/ && ' + 
						 'cp -r <%= deploy.' + env + '.root %>/releases/' + version() + '/* <%= deploy.' + env + '.root %>/current',
				options: {
					host: '<%= deploy.' + env + '.host %>',
					username: '<%= deploy.' + env + '.username %>',
					privateKey: grunt.file.read('deploy/key.pem')
				}
			},
			completion: {
				command: 'supervisorctl stop ' + (env === 'development' ? 'dev-' : '') + 'financebutler-support && ' + 
						 'supervisorctl start ' + (env === 'development' ? 'dev-' : '') + 'financebutler && ' + 
						 'rm -r <%= deploy.' + env + '.root %>/current-tmp',
				options: {
					host: '<%= deploy.' + env + '.host %>',
					username: '<%= deploy.' + env + '.username %>',
					privateKey: grunt.file.read('deploy/key.pem')
				}
			}
		}
	});

	grunt.registerTask('deploy', ['clean', 'hub', 'bump', 'compress', 'sftp-deploy', 'sshexec:prepare', 'sshexec:deploy', 'sshexec:completion']);
	grunt.registerTask('default', ['deploy']);
};