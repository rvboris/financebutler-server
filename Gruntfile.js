var moment = require('moment');

module.exports = function (grunt) {

    var version = function () {
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

        sshAuth: {
            host: '<%= deploy.' + env + '.host %>',
            username: '<%= deploy.' + env + '.username %>',
            privateKey: grunt.file.read('deploy/key.pem')
        },

        clean: {
            build: [
                'public/*',
                'deploy/*.zip'
            ]
        },

        hub: {
            build: {
                src: ['frontend/Gruntfile.js'],
                tasks: ['build']
            }
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
                            './app-cli.js',
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
            backup: {
                command: [
                    'mkdir -p <%= deploy.' + env + '.root %>/backups',
                    'mkdir -p <%= deploy.' + env + '.root %>/app',
                    'cp -r <%= deploy.' + env + '.root %>/app <%= deploy.' + env + '.root %>/backups/' + now
                ].join(' && '),
                options: '<%= sshAuth %>'
            },
            clean: {
                command: [
                    'pm2 stop ' + (env === 'development' ? 'dev.' : '') + 'financebutler',
                    'rm -r <%= deploy.' + env + '.root %>/app'
                ].join(' && '),
                options: '<%= sshAuth %>'
            },
            install: {
                command: [
                    'unzip /tmp/<%= deploy.' + env + '.host %>-' + version() + '.zip -d <%= deploy.' + env + '.root %>/app',
                    'cd <%= deploy.' + env + '.root %>/app',
                    'npm install --silent'
                ].join(' && '),
                options: '<%= sshAuth %>'
            },
            reload: {
                command: 'pm2 start ~/.pm2/' + (env === 'development' ? 'dev.' : '') + 'financebutler.json',
                options: '<%= sshAuth %>'
            }
        }
    });

    grunt.registerTask('deploy', ['clean', 'hub', 'bump', 'compress', 'sftp-deploy', 'sshexec']);
    grunt.registerTask('default', ['deploy']);
};