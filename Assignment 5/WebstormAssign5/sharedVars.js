/**
 *      Created by oKevi on 4/6/2016.
 * This file deals with some functions that are used by both movies.js and movie.js
 */

// TODO: Get reviews

var http = require('http');
var util = require('util');
var usergrid = require('usergrid');
var client = new usergrid.client({
    URI:'https://api.usergrid.com',
    orgName: 'kevinwhy',
    appName:'sandbox',
    //orgName:'test-organization',
    //URI:'http://localhost:8080',
    //appName:'test-app',
    //authType:usergrid.AUTH_CLIENT_ID,
    //clientId: 'b3U6KeTx6ss2EeS-Ks3FPB4eRg',
    //clientSecret: 'b3U6bBtuO1drazog6B3ZQYIw--jicfA',
    logging: true, //optional - turn on logging, off by default
});
module.exports = {
    usergrid: usergrid,
    client: client, // Let other files use this client
    sendAnalytic: sendAnalytic,
    sendError: sendError,
    parseFilter: parseFilter,
    parseNewProps: parseNewProps,
    shouldGetReviews: shouldGetReviews,

    valueInArray: valueInArray
};

/*
 * Tell the proxy that someone used GET on the movie.
 */
function sendAnalytic(movieName) {
    var data = util.format("%j", {movie: movieName});
    // Prepare to send a request to the same proxy
    var ip = process.env.IP || 'localhost';
    var port = process.env.PORT || 10010;
    var options = {
        host: ip,
        path: '/analytics',
        //since we are listening on a custom port, we need to specify it by hand
        port: port,
        //This is what changes the request to a POST request
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    var req = http.request(options, null);
    req.write(data);
    req.end();
//    console.log('\t\tAnalytic sent to '+ movieName); // DEBUG
}
/*
 * Returns an error message to the user.
 */
function sendError(resp,statusCode, message, error) {
    resp.statusCode = statusCode;
    var respData = {'message': message};
    if (error) {
        respData.error = error;
        console.log("Error json found.");
    } else {
        console.log("Error json NOT found.");
    }
    resp.json(respData);
}

/*
 * Converts the params associative array into a javascript object.
 *      Has 'name', 'year', and 'actor'
 *      Also says how many params were specified in 'length'
 *      Unspecified values are set to ''
 */
function parseFilter(params) {
//    console.log(util.format('params given: %j', params)); // DEBUG
    var obj = {
        // For obj to have a value, that param must exist...
        name: (typeof(params.name.value) != 'undefined') ? params.name.value : '',
        // Year must also be an int... but is still stored as a string.
        year: (typeof(params.year.value) != 'undefined' && parseInt(params.year.value, 10)) ? params.year.value : '',
        actor: (typeof(params.actor.value) != 'undefined') ? params.actor.value : ""
    };
    // Count how many params were specified
    obj.length = 0;     var key;
    for (key in obj) {
        if (obj[key] != '' && key != 'length')
            ++obj.length;
    }

    return obj;
}
/*
 * Converts the params associative array into a javascript object.
 *      Has 'name', 'year', and 'actors'
 *      Also says how many params were specified in 'length'
 *      Unspecified values are set to ''
 */
function parseNewProps(params) {
//    console.log(util.format('params given: %j', params)); // DEBUG
    var obj = {
        name: '',
        year: '',
        actors: ''
    }
    // If new properties weren't defined, stop
    if (typeof(params['new-params'].value) == 'undefined')
        return obj;

    var paramJson = JSON.parse(params['new-params'].value);
    // For obj to have a value, that param must exist...
    if (typeof(paramJson.name) == 'string')
        obj.name = paramJson.name;
    // Year must also be an int... but is still stored as a string.
    if (typeof(paramJson.year) != 'undefined' && parseInt(paramJson.year, 10))
            obj.year = paramJson.year;
    // Copy the first 3 actors from the params
    try {
        if (Array.isArray(paramJson.actors)) {
            obj.actors = [];
            // Try to insert first three actors specified in param
            var index;
            for (index=0; index < 3; ++index) {
                if (index < paramJson.actors.length && typeof(paramJson.actors[index]) == 'string') {
                    // If still can add an actor...
                    obj.actors.push(paramJson.actors[index]);
                } else {
                    // If not enough actors specified...
                    obj.actors = '';
                }
            }
        }
    } catch(e) { } // If failed to format, don't worry

    // Count how many params were specified
    obj.length = 0;     var key;
    for (key in obj) {
        if (obj[key] != '' && key != 'length')
            ++obj.length;
    }
    return obj;
}
/*
 * Returns true if proxy should return reviews for this movie.
 */
function shouldGetReviews(params) {
    if (typeof(params['reviews'].value) == 'undefined')
        return false;
    return (params['reviews'].value == true);
}

////////////////////////////////

/*
 * Returns true if the value is in the array.
 */
function valueInArray(arr, value) {
    var index;
    for (index=0; index < arr.length; ++index) {
        if (arr[index] == value)
            return true;
    }
    return false;
}
