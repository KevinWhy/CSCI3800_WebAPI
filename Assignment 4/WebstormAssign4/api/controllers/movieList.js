/**
 * Created by oKevi on 4/6/2016.
 * Deals with queries to multiple movies.
 */

var sharedVars = require('../../sharedVars.js');
var async = require('async');
var util = require('util');
var movie = require('./movie.js');
module.exports = {
    getMovies: getMovies,
    addMovie: movie.addMovie, // When POSTING a new movie, call the function in movie.js
    changeMovies: changeMovies,
    deleteMovies: deleteMovies,

    resetMovies: resetMovies
};

/*
 * Returns a list of movies that match the request's filter.
 */
function getMovies (req, resp) {
    console.log("\tgetMovies called");
    var filter = sharedVars.parseFilter(req.swagger.params);
    getFilteredMovies(filter, function(getError, data) {
        if (getError) // If an error occured, just say it failed
            sharedVars.sendError(500, 'Failed to get a list of movies. error: '+ getError, resp);
        else // If successful, send json back
            resp.json(data);
    });
}
/*
 * Change all movies that match the request's filter.
 */
function changeMovies(req, resp) {
    console.log("\tchangeMovies called");
    var filter = sharedVars.parseFilter(req.swagger.params);
    var newProps = sharedVars.parseNewProps(req.swagger.params);
    // If not enough parameters were specified, stop
    if (newProps.length < 1) {
        console.log("\t\tNot enough params to change movies");
        sharedVars.sendError(400, "Can't change movies. At least one parameter in the JSON body must be valid.", resp);
        return;
    }

    // I filter on actor, which I can't do with query parameters.
    // So, I need to get a list of valid movies, and modify each one separately
    getFilteredMovies(filter, function(getError, data) {
        if (getError) { // If failed to find the movies, just say it failed
            sharedVars.sendError(500, 'Failed to get movies to change. error: '+ error, resp);
        } else { // If successful, change each movie...
            console.log("\tList of movies acquired. Changing each one...");
            var respData = {changeResp: []};

            async.each(data.entities, function(cMovie, callback) { // Is called on each request
                movie.changeMovieByUuid(cMovie.uuid, newProps, function(changeError, changeData) {
                    if (changeError) { // If an error occurs, stop immediately
                        callback('Failed to change a movie. error: ' + changeError);
                    } else {
                        console.log(util.format("\tresp: %j", changeData));
                        respData.changeResp.push(changeData); // No error occured. Add response to list of responses
                        callback(); // And finish this request
                    }
                });

            }, function(error) { // Is called when all requests are done
                if (error) { // If failed to change some movies, send the error back
                    resp.statusCode = 500;
                    respData.message = error;
                }
                resp.json(respData);
            });
        }
    });
}
/*
 * Delete all movies that match the request's filter.
 * This is very similar to changeMovies()
 */
function deleteMovies(req, resp) {
    console.log("\tdeleteMovies called");
    var filter = sharedVars.parseFilter(req.swagger.params);
    // List in changeMovies(), I need to get a list of valid movies, and delete each one separately
    getFilteredMovies(filter, function(getError, data) {
        if (getError) { // If failed to find the movies, just say it failed
            sharedVars.sendError(500, 'Failed to get movies to delete. error: '+ getError, resp);
        } else { // If successful, delete each movie...
//            console.log("\tList of movies acquired. Deleting each one..."); // DEBUG
            var respData = {deleteResp: []};

            async.each(data.entities, function(cMovie, callback) { // Is called on each request
                movie.deleteMovieByUuid(cMovie.uuid, function(delError, delData) {
                    if (delError) { // If an error occurs, stop immediately
                        callback('Failed to delete a movie. error: '+ delError);
                    } else {
//                        console.log(util.format("\tresp: %j", delData)); // DEBUG
                        respData.deleteResp.push(delData); // No error occured. Add response to list of responses
                        callback(); // And finish this request
                    }
                });

            }, function(error) { // Is called when all requests are done
                if (error) { // If failed to delete some movies, send the error back
                    resp.statusCode = 500;
                    respData.message = error;
                }
                resp.json(respData);
            });
        }
    });
}

/*
 * This function reverts the collection to its initial state.
 * (The UUIDs will change though.)
 */
function resetMovies(req, resp) {
    console.log("\tresetMovies called");
    // List of movies that will be in the collection
    var defaultMovies = [
        {   "title": "testA",
            "year": "2000",
            "actors": ["Allie", "Archer", "Asteroid"]
        },
        {   "title": "testB",
            "year": "2001",
            "actors": ["Bill", "Bake", "Boolean"]
        },
        {   "title": "Slow and Serious",
            "year": "2001",
            "actors": ["Sam", "Snake", "Snail"]
        },
        {
            "title": "Outside In",
            "year": "2010",
            "actors": ["Park", "Hockey", "Tennis"]
        },
        {
            "title": "Castle Masher",
            "year": "1280",
            "actors": ["Archer", "Swordie", "Ballista"]
        }
    ];
    var respData = { // The full json to send to the client
        addResp: []
    };

    // Start by deleting all the movies
    var options = {
        method: 'DELETE',
        endpoint:'movies',
        qs: {ql:"select *"}
    };
    sharedVars.client.request(options, function(delError, delData) {
        if (delError) { // If an error occured on delete, stop
            sharedVars.sendError(500, 'Failed to delete all the movies. error: '+ delError, resp);
        } else { // If collection was cleared, add the default list...
            respData.deleteResp = delData;
            async.each(defaultMovies, function(newMovie, callback) { // Call this function for each movie...
                movie.addMovieWithProps(newMovie, function(newError, newData) {
                    if (newError) { // If an error occurs, stop immediately
                        callback('Failed to add a movie. error: '+ newError);
                    } else { // If insert succeeded...
                        respData.addResp.push(newData);
                        callback();
                    }
                });

            }, function(error) { // This function is called after all the requests are done
                if (error) { // If failed to add some movies, send the error back
                    resp.statusCode = 500;
                    respData.message = error;
                }
                resp.json(respData);
            });
        }
    });
}

/////////////////////////////

/*
 * Returns a list of movies that fit the specified params.
 * callback(error, data) - On success, gets the filtered list as JSON
 *      On fail, gets the error.
 */
function getFilteredMovies(filter, callback) {
    var options = {
        method: 'GET',
        endpoint:'movies',
        qs: {ql:""}
    };
    // Build query from params specified
    if (filter.title != '') {
        if (options.qs.ql != "") // For multiple parameters
            options.qs.ql += ",";
        options.qs.ql += "title contains '"+ filter.title +"*'";
    }
    if (filter.year != '') {
        if (options.qs.ql != "") // For multiple parameters
            options.qs.ql += ",";
        options.qs.ql += "year='"+ filter.year +"'";
    }

    // Send the request
    /* client.request() options:
     *      `method` - http method (GET, POST, PUT, or DELETE), defaults to GET
     *      `qs` - object containing querystring values to be appended to the uri
     *      `body` - object containing entity body for POST and PUT requests
     *      `endpoint` - API endpoint, for example 'users/fred'
     *      `mQuery` - boolean, set to true if running management query, defaults to false
     */
    sharedVars.client.request(options, function(getError, data) {
        if (!getError) { // If successful, filter based on actor
            if (filter.actor != '')
                filterActor(data.entities, filter.actor);
        }
        callback(getError, data);
    });
}
/*
 * Removes all movies that don't have the specified actor.
 */
function filterActor(movieList, actor) {
//    console.log('Movies removed:'); // Debug: print movie removed
    var movieIndex = 0;
    while (movieIndex < movieList.length) {
        if (sharedVars.valueInArray(movieList[movieIndex].actors, actor)) {
            // Actor was found...
            ++movieIndex;
        } else {
            // Actor was not found...
//            console.log(util.format('\t%j', movieList[movieIndex])); // Debug: print movie removed
            movieList.splice(movieIndex, 1); // Remove current movie
        }
    }
}
