/**
 * Created by oKevi on 4/8/2016.
 * Deals with queries that apply to one movie.
 */
/* TODO:
 *      - Add logging for normal requests
 */

var sharedVars = require('../../sharedVars.js');
var util = require('util');
module.exports = {
    getMovie: getMovie,
    addMovie: addMovie,
    changeMovie: changeMovie,
    deleteMovie: deleteMovie,

    addMovieWithProps: addMovieWithProps,
    changeMovieById: changeMovieById,
    deleteMovieById: deleteMovieById
};

/*
 * Get a movie from its uuid/name.
 */
function getMovie(req, resp) {
    console.log("\tgetMovie called");
    // ID check probably unneeded, since Swagger says it need ID
/*    if (typeof(req.swagger.params.id.value) == 'undefined') {
        sharedVars.sendError(resp,400, "Can't find a movie. No UUID/name specified.");
        return;
    }*/
    var options = {
        type: 'movies5',
        uuid: req.swagger.params.id.value
    };
    /* getEntity options:
     * options {data:{'type':'collection_type', 'name':'value', 'username':'value'}, uuid:uuid}}
     */
    sharedVars.client.getEntity(options, function(getError, entData) {
        if (getError)
            sharedVars.sendError(resp,500, "Failed to find a movie.", entData);
        else {
            sharedVars.sendAnalytic(entData.get('name')); // Update analytics
            if (!sharedVars.shouldGetReviews(req.swagger.params)) {
                // If no reviews needed, just return the data
                resp.json(entData);
            } else {
                appendReviews(entData, function(connErr, errJson) {
                    if (connErr) // If couldn't get reviews, error
                        sharedVars.sendError(resp,500, "Failed to get movie's connections.", errJson);
                    else // Otherwise, return new data
                        resp.json(entData);
                })
            }
        }
    });
}
/*
 * The post requests for movies calls this function.
 */
function addMovie(req, resp) {
    console.log("\taddMovie called");
    var newProps = sharedVars.parseNewProps(req.swagger.params);
//    console.log("post called with new props: "+ util.format('%j', newProps)); // DEBUG
    // If not enough parameters were specified, stop
    if (newProps.length < 3) {
        console.log("\t\tNot enough params to add movie");
        sharedVars.sendError(resp,400, "Can't make a movie. All parameters in the JSON body must be valid.");
        return;
    }

    // Add movie to the list
    delete newProps.length; // Remove length from movie...
    addMovieWithProps(newProps, function(addError, data) {
        if (addError)
            sharedVars.sendError(resp,500, 'Failed to make movie.', data);
        else
            resp.json(data);
    });
}

/*
 * Change one movie.
 */
function changeMovie(req, resp) {
    console.log("\tchangeMovie called");
    var newProps = sharedVars.parseNewProps(req.swagger.params);
    // If not enough parameters were specified, stop
    if (newProps.length < 1) {
        console.log("\t\tNot enough params to change movie");
        sharedVars.sendError(resp,400, "Can't change a movie. At least one parameter in the JSON body must be valid.");
        return;
    }
    changeMovieById(req.swagger.params.id.value, newProps, function(changeError, data) {
        if (changeError)
            sharedVars.sendError(resp,500, 'Failed to change a movie.', data);
        else
            resp.json(data);
    });
}
/*
 * Remove one movie.
 */
function deleteMovie(req, resp) {
    console.log("\tdeleteMovie called");
    // Just send the delete request...
    deleteMovieById(req.swagger.params.id.value, function(deleteError, data) {
        if (deleteError)
            sharedVars.sendError(resp,500, 'Failed to delete movie.', deleteError);
        else
            resp.json(data);
    });
}

/////////////////////////////////////////

/*
 * Add a movie with the specified properties.
 * 'type' is set to 'movies5'
 * callback - Function should have params: (err, data)
 *
 * Is also used by movieList.js
 */
function addMovieWithProps(newProps, callback) {
    newProps.type = 'movies5';
    // ... and send response to the client
    sharedVars.client.createEntity(newProps, callback);
}

/*
 * Given a movie's uuid/name and values to change, change it.
 * Unchanged values should be ''
 * callback - Function should have params: (err, data)
 *
 * Is also used by movieList.js
 */
function changeMovieById(id, newProps, callback) {
    var options = {
        method: 'PUT',
        endpoint:'movies5s/'+ id,
//        qs: {ql: "uuid="+ uuid},
        body: {}
    };
    // Build query from params specified
    if (newProps.name != '') { // Don't allow user to change name
        callback(true, 'Apigee does not allow name-changes. Instead, DELETE this entity and rePOST it.');
        return;
    }
    if (newProps.year != '')
        options.body.year = newProps.year;
    if (newProps.actors != '')
        options.body.actors = newProps.actors;

//    console.log("\tchanging... newProps: "+ util.format("%j", newProps));
//    console.log("\tchanging... options: "+ util.format("%j", options));
    // Send the request
    sharedVars.client.request(options, callback);
}
/*
 * Delete the movie with the UUID/name.
 * Is also used by movieList.js
 */
function deleteMovieById(id, callback) {
    var options = {
        method: 'DELETE',
        endpoint:'movies5s/'+ id
//        qs: {ql: "uuid="+ uuid}
    };
    // Send the request
    sharedVars.client.request(options, callback);
}

/*
 * Add reviews to the movie data acquired from server.
 * Works on usergrid entities.
 *      callback(err, errJson) - If err, data = error json.
 *              Otherwise, both err and errJson = false.
 */
function appendReviews(movieData, callback) {
    var options = {
//        method: 'GET',
//        endpoint:this.get('type') +'/'+ this.getEntityId(this) +'/connecting/reviews'
    };
    movieData.getConnections('connecting/reviews', options, function(error, data, connections) {
        if (error) { // If couldn't get connections, return error
            movieData.set('reviews', data);
            callback(connErr, data);
        } else { // If connections acquired, append entities to movieData
            movieData.set('reviews', connections);
            callback(false, connections);
        }
    });
}
