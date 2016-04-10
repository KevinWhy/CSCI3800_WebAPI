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
    changeMovieByUuid: changeMovieByUuid,
    deleteMovieByUuid: deleteMovieByUuid
};

/*
 * Get a movie from its uuid.
 */
function getMovie(req, resp) {
    console.log("\tgetMovie called");
    // UUID check probably unneeded, since Swagger says it need UUID
/*    if (typeof(req.swagger.params.uuid.value) == 'undefined') {
        sharedVars.sendError("Can't find a movie. No UUID specified.", resp);
        return;
    }*/
    var options = {
        type: 'movie',
        uuid: req.swagger.params.uuid.value
    };
    /* getEntity options:
     * options {data:{'type':'collection_type', 'name':'value', 'username':'value'}, uuid:uuid}}
     */
    sharedVars.client.getEntity(options, function(getError, data) {
        if (getError)
            sharedVars.sendError(500, "Failed to find a movie. error: "+ getError, resp);
        else
            resp.json(data);
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
        sharedVars.sendError(400, "Can't make a movie. All parameters in the JSON body must be valid.", resp);
        return;
    }

    // Add movie to the list
    delete newProps.length; // Remove length from movie...
    addMovieWithProps(newProps, function(addError, data) {
        if (addError)
            sharedVars.sendError(500, 'Failed to make movie. error: '+ addError, resp);
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
        sharedVars.sendError(400, "Can't change a movie. At least one parameter in the JSON body must be valid.", resp);
        return;
    }
    changeMovieByUuid(req.swagger.params.uuid.value, newProps, function(changeError, data) {
        if (changeError)
            sharedVars.sendError(500, 'Failed to change a movie. error: '+ changeError, resp);
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
    deleteMovieByUuid(req.swagger.params.uuid.value, function(deleteError, data) {
        if (deleteError)
            sharedVars.sendError(500, 'Failed to delete movie. error: '+ deleteError, resp);
        else
            resp.json(data);
    });
}

/////////////////////////////////////////

/*
 * Add a movie with the specified properties.
 * 'type' is set to 'movies'
 * callback - Function should have params: (err, data)
 *
 * Is also used by movieList.js
 */
function addMovieWithProps(newProps, callback) {
    newProps.type = 'movie';
    // ... and send response to the client
    sharedVars.client.createEntity(newProps, callback);
}

/*
 * Given a movie's uuid and values to change, change it.
 * Unchanged values should be ''
 * callback - Function should have params: (err, data)
 *
 * Is also used by movieList.js
 */
function changeMovieByUuid(uuid, newProps, callback) {
    var options = {
        method: 'PUT',
        endpoint:'movies/'+ uuid,
        qs: {ql: "uuid="+ uuid},
        body: {}
    };
    // Build query from params specified
    if (newProps.title != '')
        options.body.title = newProps.title;
    if (newProps.year != '')
        options.body.year = newProps.year;
    if (newProps.actors != '')
        options.body.actors = newProps.actors;

    // Send the request
    sharedVars.client.request(options, callback);
}
/*
 * Delete the movie with the UUID.
 * Is also used by movieList.js
 */
function deleteMovieByUuid(uuid, callback) {
    var options = {
        method: 'DELETE',
        endpoint:'movies/'+ uuid,
        qs: {ql: "uuid="+ uuid}
    };
    // Send the request
    sharedVars.client.request(options, callback);
}
