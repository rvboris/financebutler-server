var Sequelize = require('sequelize');

module.exports = function (express) {
    var Store = express.session.Store;

    function SequelizeStore(app) {
        Store.call(this);
        this.model = app.get('models').Session;
    }

    SequelizeStore.prototype.__proto__ = Store.prototype;

    SequelizeStore.prototype.get = function (sid, fn) {
        this.model
            .find({ where: { 'sid': sid } })
            .success(function (session) {
                if (!session) {
                    fn();
                    return;
                }

                try {
                    var data = JSON.parse(session.data);
                    fn(null, data);
                } catch (e) {
                    fn(e);
                }
            })
            .error(fn);
    };

    SequelizeStore.prototype.set = function (sid, data, fn) {
        var stringData = JSON.stringify(data);

        this.model
            .findOrCreate({ 'sid': sid }, { 'data': stringData })
            .success(function (session) {
                if (session.data !== stringData) {
                    session.data = JSON.stringify(data);
                    session
                        .save()
                        .success(function () {
                            if (fn) {
                                fn(null, data);
                            }
                        }).error(function (error) {
                            if (fn) {
                                fn(error);
                            }
                        });
                } else {
                    fn(null, session);
                }
            })
            .error(function (error) {
                if (fn) {
                    fn(error);
                }
            });
    };

    SequelizeStore.prototype.destroy = function (sid, fn) {
        this.model
            .find({ where: { 'sid': sid } })
            .success(function (session) {
                session.destroy().success(fn).error(fn);
            })
            .error(function (error) {
                if (fn) {
                    fn(error);
                }
            });
    };

    //noinspection JSValidateTypes
    SequelizeStore.prototype.length = function (fn) {
        this.model
            .count()
            .success(function (c) {
                fn(null, c);
            })
            .error(fn);
    };

    SequelizeStore.prototype.clear = function (fn) {
        this.model
            .findAll()
            .success(function (sessions) {
                var chainer = new Sequelize.Utils.QueryChainer();

                Sequelize.Utils._.each(sessions, function (session) {
                    chainer.add(session.destroy());
                });

                chainer.run().success(fn).error(fn);
            })
            .error(fn);
    };

    return SequelizeStore;
}