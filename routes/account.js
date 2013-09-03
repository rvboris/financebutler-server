module.exports = function (app) {
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
    });
};