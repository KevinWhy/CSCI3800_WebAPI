/*
 * This is my main proxy file.
 */

var express = require('express');
var githubApi = require('github');

var app = express();
var github = new githubApi({version:'3.0.0'});
var tokens = require('./tokens.js');

github.authenticate({
    type: 'token',
    token: tokens.githubToken
});

// JSON to send when user isn't specified.
var fromParamsErr = {
    code: 404,
    message: {
        message: 'There were too many parameters in the query. Try specifying only "user"'
    }
};
// JSON to send when user isn't specified.
var fromUserErr = {
    code: 404,
    message: {
        message: 'User must be specified for getFrom.'
    }
};
// JSON to send when someone tries to use the wrong method.
var methodErr = {
    code: 405,
    message: {
        message: 'Method not allowed. Try GET instead.'
    }
};
/*
 * Send some JSON to the client.
 * json should be formatted like github's messages.
 */
function sendErrorJson(resp, json) {
    resp.status(json.code);
    resp.send(json);
    resp.end();
}
/*
 * Get number of keys in associative array.
 */
function getLength(arr) {
    var size = 0;
    for (key in arr)
        ++size;
    return size;
}

/*
 * Make sure user only GETs the 'getFrom' resource.
 */
app.all('/getFrom', function(req, resp, next) {
    if (req.method == 'GET') {
        var user = req.query['user'];
        // If user is not specified...
        if (!user || user == '')
            sendErrorJson(resp, fromUserErr);
        // If too many parameters...
        else if (getLength(req.query) > 1)
            sendErrorJson(resp, fromParamsErr);
        // Request is valid...
        else
            next();
    }
    else {
        sendErrorJson(resp, methodErr);
    }
}, function(req, resp) {
    // Make a request to github for user's information
    github.user.getFrom({
        user: req.query.user
//        user: "kevinwhy"
//        user: "mikedeboer"
    }, function(gitErr, gitRes) {
        if (gitErr) {
            console.log("getFrom error: " + gitErr);
            sendErrorJson(resp, gitErr);
        } else {
            console.log("getFrom OK: "+ JSON.stringify(gitRes) +"\ndone","","\n");
            resp.status(200);
            resp.send(gitRes);
            resp.end();
        }
    });
});

// JSON to send when user is specified for emails
var emailParamsErr = {
    code: 404,
    message: {
        message: 'getEmails does not accept any query parameters.'
    }
};
/*
 * Make sure user only GETs the 'getEmails' resource.
 */
app.all('/getEmails', function(req, resp, next) {
    if (req.method == 'GET') {
        // If too many parameters...
        if (getLength(req.query) > 0)
            sendErrorJson(resp, emailParamsErr);
        // Request is valid...
        else
            next();
    } else {
        sendErrorJson(resp, methodErr);
    }
}, function(req, resp) {
    // Make a request to github for my emails
    github.user.getEmails({
//        user: user
    }, function(gitErr, gitRes) {
        if (gitErr) {
            console.log("getEmails error: " + gitErr);
            sendErrorJson(resp, gitErr);
        } else {
            console.log("getEmails OK: "+ JSON.stringify(gitRes) +"\ndone","","\n");
            resp.status(200);
            resp.send(gitRes);
            resp.end();
        }
    });
});

console.log("http://localhost:3000/getFrom?user=kevinwhy");
module.exports = app;
