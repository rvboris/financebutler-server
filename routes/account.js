var _ = require('lodash');

module.exports = function(app) {
    app.param('accountId', Number);

    app.namespace('/api/:apiKey/account', function() {

        app.get('/', app.get('restRestrict'), function(req, res) {
            req.user
                .getAccounts()
                .success(function(accounts) {
                    res.send(accounts);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.post('/', app.get('restRestrict'), function(req, res) {
            if (!req.body.currency || !req.body.startValue || !req.body.name) {
                res.send(400);
                return;
            }

            app.get('models').Currency
                .find(req.body.currency)
                .success(function(currency) {
                    if (!currency) {
                        res.send(404);
                        return;
                    }

                    app.get('models').Account
                        .create({
                            name: req.body.name,
                            startValue: req.body.startValue,
                            currentValue: req.body.startValue,
                            userId: req.user.id,
                            currencyId: currency.id
                        })
                        .success(function(account) {
                            res.send(account);
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

        app.get('/:accountId', app.get('restRestrict'), function(req, res) {
            app.get('models').Account
                .find(req.params.accountId)
                .success(function(account) {
                    if (!account) {
                        res.send(404);
                        return;
                    }

                    res.send(account);
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });

        app.delete('/:accountId', app.get('restRestrict'), function(req, res) {
            app.get('models').Account
                .find(req.params.accountId)
                .success(function(account) {
                    if (!account) {
                        res.send(404);
                        return;
                    }

                    account
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

            app.get('models').Currency
                .find(req.body.currency)
                .success(function(currency) {
                    if (!currency) {
                        res.send(404);
                        return;
                    }

                    app.get('models').Account
                        .find(req.params.accountId)
                        .success(function(account) {
                            if (!account) {
                                res.send(404);
                                return;
                            }

                            account.name = req.body.name;
                            account.startValue = req.body.startValue;
                            account.currencyId = currency.id;

                            account
                                .save()
                                .success(function(account) {
                                    res.send(account);
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
                })
                .error(function(err) {
                    app.get('log').error(err.stack);
                    res.send(500);
                });
        });
    });
};