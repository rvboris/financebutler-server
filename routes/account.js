var _ = require('lodash');
var Sequelize = require('sequelize');

module.exports = function (app) {
    app.param('accountId', Number);

    app.namespace('/api/:apiKey/account', function () {

        app.get('/', app.get('restRestrict'), function (req, res) {
            req.user
                .getAccounts()
                .success(function (accounts) {
                    res.json(accounts);
                })
                .error(function (err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.post('/', app.get('restRestrict'), function (req, res) {
            if (!req.body.currency || !req.body.startValue || !req.body.name) {
                res.send(400);
                return;
            }

            app.get('models').Currency
                .find(req.body.currency)
                .success(function (currency) {
                    if (!currency) {
                        res.send(404);
                        return;
                    }
                    app.get('models').Account
                        .create({
                            name: req.body.name,
                            startValue: req.body.startValue,
                            currentValue: req.body.startValue
                        })
                        .success(function (account) {
                            account
                                .setCurrency(currency)
                                .success(function (account) {
                                    account
                                        .setUser(req.user)
                                        .success(function () {
                                            res.json(account);
                                        })
                                        .error(function (err) {
                                            app.get('log').error(err.stack);
                                            res.send(500);
                                        });

                                })
                                .error(function (err) {
                                    app.get('log').error(err.stack);
                                    res.send(500);
                                });

                        })
                        .error(function (err) {
                            app.get('log').error(err.stack);
                            res.send(500);
                        });
                })
                .error(function (err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.delete('/:accountId', app.get('restRestrict'), function(req, res) {
            req.user
                .getAccounts()
                .success(function(accounts) {
                    var accountToDelete = _.find(accounts, function(account) {
                        return account.id === req.params.accountId;
                    });

                    if (!accountToDelete) {
                        res.send(404);
                        return;
                    }

                    accountToDelete
                        .destroy()
                        .success(function() {
                            res.send(200);
                        })
                        .error(function(err) {
                            app.get('log').error(err.stack);
                            res.send(500);
                        });
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.put('/:accountId', app.get('restRestrict'), function(req, res) {
            if (!req.body.currency || !req.body.startValue || !req.body.name) {
                res.send(400);
                return;
            }

            new Sequelize.Utils.QueryChainer()
                .add(app.get('models').Account, 'find', [req.params.accountId])
                .add(app.get('models').Currency, 'find', [req.body.currency])
                .runSerially({ skipOnError: true })
                .success(function(results) {
                    console.log(results);
                    var account = results[0];
                    var currency = results[1];

                    account.name = req.body.name;
                    account.startValue = req.body.startValue;
                    account.setCurrency(currency);

                    account
                        .save()
                        .success(function() {
                            res.send(200);
                        })
                        .error(function(err) {
                            app.get('log').error(err.stack);
                            res.send(500);
                        });
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });
    });
};