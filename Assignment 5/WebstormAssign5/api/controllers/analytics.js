/**
 * Created by oKevi on 4/19/2016.
 * This file handles all the analytics for the proxy.
 */

var sharedVars = require('../../sharedVars.js');
module.exports = {
    getAnalytics: getAnalytics,
    postAnalytics: postAnalytics
};

/**
 * Read the analytics for this movie.
 */
function getAnalytics(req, resp) {
    var movieName = getMovieName(req.swagger.params);
    console.log('\t\tGET analytic:'+ movieName);
    if (movieName == '') {
        sharedVars.sendError(resp,400, 'Must specify movie to GET analytics for it.');
        return;
    }
    resp.json({
        message: "Analytics here for "+ movieName
    });
}
/**
 * Analytics are read via Apigee, so just return a message.
 */
function postAnalytics(req, resp) {
    var movieName = getMovieName(req.swagger.params);
    console.log('\t\tPOST analytic:'+ movieName);
    if (movieName == '') {
        sharedVars.sendError(resp,400, 'Must specify movie to POST analytics for it.');
        return;
    }
    resp.json({
        message: "Analytics posted. "+ movieName
    });
}

/**
 * Get name of the movie for analytics.
 */
function getMovieName(params) {
    if (typeof(params.movie.value) == 'undefined')
        return '';
    var data = JSON.parse(params.movie.value);
    return (typeof(data.movie) == 'string') ? data.movie : '';
}