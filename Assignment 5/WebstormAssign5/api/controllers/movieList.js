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
        if (getError) {// If an error occured, just say it failed
            sharedVars.sendError(resp, 500, 'Failed to get a list of movies.', data);
        } else {// If successful, send json back
            // Update analytics for all the movies
            console.log("\tSending analytics for movie list...");
            for(var movieIndex in data.entities) {
                sharedVars.sendAnalytic(data.entities[movieIndex].name);
            }
            if (!sharedVars.shouldGetReviews(req.swagger.params)) {
                // If no reviews needed, just return the data
                resp.json(data);

            } else {
                // Add reviews to each movie in the list
                console.log("\t\tAppending reviews to list...");
                async.each(data.entities, function(movie, callback) { // Is called for each request
                    // Manually ask for connections...
                    getReviews(movie, function(revError, revData) {
                        movie.reviews = revData;
                        if (revError) // If couldn't append reviews to movie, report error
                            callback(revData);
                        else // If reviews appended successfully, return
                            callback();
                    });
                }, function(error) { // Is called after all requests are done
                    if (error) { // If an error occurred, set error message
                        resp.statusCode = 500;
                        data.message = error;
                    }
                    resp.json(data);
                });
            }
        }
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
        sharedVars.sendError(resp,400, "Can't change movies. At least one parameter in the JSON body must be valid.");
        return;
    }

    // I filter on actor, which I can't do with query parameters.
    // So, I need to get a list of valid movies, and modify each one separately
    getFilteredMovies(filter, function(getError, movies) {
        if (getError) { // If failed to find the movies, just say it failed
            console.log("\t\tFailed to get list of movies to change. reason: "+ util.format('%j', error));
            sharedVars.sendError(resp,500, 'Failed to get movies to change.', movies);
        } else { // If successful, change each movie...
            console.log("\t\tList of movies acquired. Changing each one...");
            var respData = {responses: []};

            async.each(movies.entities, function(cMovie, callback) { // Is called on each request
                movie.changeMovieById(cMovie.uuid, newProps, function(changeError, changeData) {
                    respData.responses.push(changeData); // Add response to list of responses
                    if (changeError) { // If an error occurs, stop immediately
                        callback(changeData);
                    } else {
                        callback(); // And finish this request
                    }
                });

            }, function(error) { // Is called when all requests are done
                if (error) { // If failed to change some movies, send the error back
                    resp.statusCode = 500;
                    respData.message = error;
                    console.log("\t\tFailed to change some movies. reason: "+ util.format('%j', error));
                } else {
                    console.log("\t\tSuccessfully changed movies.");
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
    getFilteredMovies(filter, function(getError, movies) {
        if (getError) { // If failed to find the movies, just say it failed
            console.log("\t\tFailed to get movies to delete. reason: "+ util.format('%j', movies));
            sharedVars.sendError(resp,500, 'Failed to get movies to delete.', movies);
        } else { // If successful, delete each movie...
//            console.log("\tList of movies acquired. Deleting each one..."); // DEBUG
            var respData = {responses: []};

            async.each(movies.entities, function(cMovie, callback) { // Is called on each request
                movie.deleteMovieById(cMovie.uuid, function(delError, delData) {
                    respData.responses.push(delData); // Add response to list of responses
                    if (delError) { // If an error occurs, stop immediately
                        callback(delError);
                    } else {
//                        console.log(util.format("\tresp: %j", delData)); // DEBUG
                        callback(); // And finish this request
                    }
                });

            }, function(error) { // Is called when all requests are done
                if (error) { // If failed to delete some movies, send the error back
                    resp.statusCode = 500;
                    respData.message = error;
                    console.log("\t\tFailed to delete some movies. reason: "+ util.format('%j', error));
                } else {
                    console.log("\t\tSuccessfully deleted the movies.");
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
        {   name: "testA",
            year: "2000",
            actors: ["Allie", "Archer", "Asteroid"],
            reviews: [
                {name: "Teacher", rating: "2", quote: "Not enough As"}
            ]
        },
        {   name: "testB",
            year: "2001",
            actors: ["Bill", "Bake", "Boolean"],
            reviews: [
                {name: "Dude", rating: "5", quote: "It was awesome"},
                {name: "Dob", rating: "1", quote: "I disagree."},
            ]
        },
        {   name: "Slow and Serious",
            year: "2001",
            actors: ["Sam", "Snake", "Snail"],
            reviews: [
                {name: "Impatient", rating: "1", quote: "Too slow"}
            ]
        },
        {
            name: "Outside In",
            year: "2010",
            actors: ["Park", "Hockey", "Tennis"],
            reviews: [
                {name: "Critic", rating: "4", quote: "Nice imagery."}
            ]
        },
        {
            name: "Castle Masher",
            year: "1280",
            actors: ["Archer", "Swordie", "Ballista"],
            reviews: [
                {name: "Blade", rating: "5", quote: "Best movie in years."}
            ]
        }
    ];
    var respData = { // The full json to send to the client
        delResponses: [],
        addResponses: []
    };

    // Start by deleting all the movies and reviews
    var delRequests = [
        {method: 'DELETE', endpoint:'movies5s', qs: {ql:"select *"}},
        {method: 'DELETE', endpoint:'reviws5s', qs: {ql:"select *"}}
    ];
    async.each(delRequests, function(delReq, delCallback) {
        console.log("\t\t\ttrying to run request: " + util.format('%j', delReq));
        sharedVars.client.request(delReq, function (delError, delData) { // Run both delete requests...
            respData.delResponses.push(delData);
            if (delError) {
//                console.log('\t\t\tdel NOPE. ' + util.format('%j', delReq)); // DEBUG
                delCallback(delData);
            }
            else {
//                console.log('\t\t\tdel OK. ' + util.format('%j', delReq)); // DEBUG
                delCallback();
            }
        });

    }, function(error) { // This is called after both delete requests are done
        if (error) { // If failed to delete some movies/reviews, send the error back
            console.log('\t\tFailed to delete stuff');
            resp.statusCode = 500;
            respData.message = error;
        } else {
            // Movies & reviews deleted successfully. Try to add the movies...
            console.log('\t\tSuccessfully deleted stuff. Now adding everything...');
            async.each(defaultMovies, function(newMovie, addCallback) { // Call this function for each movie...
                var reviews = newMovie.reviews; // Store reference to reviews to add
                delete newMovie.reviews;        // Don't insert reviews into movie entity
                movie.addMovieWithProps(newMovie, function(newError, newData) {
                    if (newError) { // If an error occurs, stop immediately
                        respData.addResponses.push(newData);
                        addCallback(newData);
                    } else { // If insert succeeded...
                        // Link reviews to movie...
                        addReviews(newData, reviews, function(revError, revData) {
                            respData.addResponses.push({
                                movieResp: newData,
                                revResponses: revData
                            });
                            if (revError) // If failed to link reviews, stop immediately
                                addCallback(revError);
                            else // If successfully linked reviews, continue...
                                addCallback();
                        });
                    }
                });

            }, function(error) { // This function is called after all the requests are done
                if (error) { // If failed to add some movies, send the error back
                    console.log("\t\tFailed to add everything. error: "+ util.format('%j', error));
                    resp.statusCode = 500;
                    respData.message = error;
                } else {
                    console.log("\t\tEverything added.");
                }
                resp.json(respData);
            });
        }
    });
}
/*
 * Add the reviews associated with the movie.
 *      reviews - Array of reviews to associate with the movie
 * Callback should recieve (error, data)
 *      data - A list of responses for the reviews.
 *             Each review is formatted as: {addReview:<response>, linkReview:<response>}
 */
function addReviews(movieData, reviews, callback) {
    var respList = [];
    console.log('\t\t\tAdding reviews for : '+ util.format('%j', movieData));
    console.log('\t\t\tReviews: '+ util.format('%j', reviews));

    async.each(reviews, function(newReview, callback) { // Call this function for each review...
        newReview.type = 'reviws5';
        console.log('\t\t\t\tAdding review: '+ util.format('%j', newReview));
        sharedVars.client.createEntity(newReview, function(newError, newData) {
            if (newError) { // If an error occurs, stop immediately
                respList.push(newData);
                callback(newData);
            } else { // If insert succeeded...
                // Try to link the movie to the entity
                newData.connect('reviews', movieData, function(connError, connData) {
                    respList.push({
                        addResponse: newData,
                        linkResponse: connData
                    });
                    if (connError) { // If link failed, report the error
                        callback(connData);
                    } else { // If link succeeded, add data to response list
                        callback();
                    }
                });
            }
        });

    }, function(error) { // This function is called after all the requests are done
        callback(error, respList);
    });
}
/*
 * Get list of reviews for the movie.
 * Works on the data returned in a query.
 *      callback(err, data)
 */
function getReviews(movieData, callback) {
    var options = {
        method: 'GET',
        endpoint:movieData.type +'/'+ movieData.uuid +'/connecting/reviews'
    };
    sharedVars.client.request(options, function(connErr, connData) {
        if (connErr) { // Failed to get connections, report error
            callback(connErr, connData);
        } else { // Connections acquired, return it
            callback(false, connData.entities);
        }
    })
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
        endpoint:'movies5s',
        qs: {ql:""}
    };
    // Build query from params specified
    if (filter.name != '') {
        if (options.qs.ql != "") // For multiple parameters
            options.qs.ql += ",";
        options.qs.ql += "name = '"+ filter.name +"'";
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
