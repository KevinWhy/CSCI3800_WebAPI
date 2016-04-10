/**
 *      Created by oKevi on 4/6/2016.
 * This file deals with some functions that are used by both movies.js and movie.js
 */

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
    client: client, // Let other files use this client
    sendError: sendError,
    parseFilter: parseFilter,
    parseNewProps: parseNewProps,

    valueInArray: valueInArray
}

/*
 * Returns an error message to the user.
 */
function sendError(statusCode, message, resp) {
    resp.statusCode = statusCode;
    resp.json({'message': message});
}

/*
 * Converts the params associative array into a javascript object.
 *      Has 'title', 'year', and 'actor'
 *      Also says how many params were specified in 'length'
 *      Unspecified values are set to ''
 */
function parseFilter(params) {
//    console.log(util.format('params given: %j', params)); // DEBUG
    var obj = {
        // For obj to have a value, that param must exist...
        title: (typeof(params.title.value) != 'undefined') ? params.title.value : '',
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
 *      Has 'new_title', 'new_year', and 'new_actors'
 *      Also says how many params were specified in 'length'
 *      Unspecified values are set to ''
 */
function parseNewProps(params) {
//    console.log(util.format('params given: %j', params)); // DEBUG
    var obj = {
        title: '',
        year: '',
        actors: ''
    }
    // If new properties weren't defined, stop
    if (typeof(params['new-params'].value) == 'undefined')
        return obj;

    var paramJson = JSON.parse(params['new-params'].value);
    // For obj to have a value, that param must exist...
    if (typeof(paramJson.title) == 'string')
        obj.title = paramJson.title;
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
