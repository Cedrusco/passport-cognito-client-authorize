const express         = require('express');
const app             = express();
const bodyParser      = require('body-parser');
const passport        = require('passport');
global.navigator = () => null;
const CognitoStrategy = require('passport-cognito');
const stringify       = require('json-stringify-safe');
const fs              = require('fs');
const path            = require('path')

fs.readFile(path.join(__dirname, 'config.json'), (err, data) => {
    // Get configuration, ensure collections are defined
    if (err) {
        throw err;
    }
    const config = JSON.parse(data.toString());

    // Configure passport to authorize a client (pass token back through middleware)
    passport.use('cognito-api-client', new CognitoStrategy({
        userPoolId: config.poolId,
        clientId: config.clientId,
        region: config.region,
        passReqToCallback: true
    },
    function(accessToken, idToken, refreshToken, profile, session, done) {
        // Send parameters through middleware - will be stored in req.account
        done(null, {
            accessToken,
            idToken,
            refreshToken,
            profile,
            session
        });
    }
    ));

    // Set up Express app
    app.use(bodyParser.urlencoded());
    app.use(passport.initialize());

    // Define a protected route
    app.get('/cognito/token', (req, res, next) => {
        // Enter credentials for the client here
        req.body.username = config.username,
        req.body.password = config.password
        next();
    }, passport.authorize('cognito-api-client'), (req, res) => {
        // Return results from Cognito Authorization
        res.status(200).send(req.account.accessToken);
    });

    app.listen(config.port || 4200);
});

