/*
 * This file actually sends the requests.
 */

// Read css file, used in sendHeaders()
var fs = require('fs');
var css = fs.readFileSync('./public/stylesheets/style.css');

// Makes an html table from a list of keys and values.
function makeTable(list, keyHeader, valueHeader) {
    var table = "<table>\n";
    // Add table headers
    table += "\t<tr><th>"+ keyHeader +"</th><th>"+ valueHeader +"</th></tr>\n";

    // Add all the keys and values
    for (var key in list) {
        table += "\t<tr><td>"+ key +"</td><td>"+ list[key] +"</td></tr>\n";
    }

    table += "</table>";
    return table;
}

// Sends a list of the headers and parameters used in the request
module.exports.sendHeaders = function(req, resp) {
    resp.set('Content-Type', 'text/html');
    var respHtml = "<html><head><style>\n"+ css +"\n</style></head><body>"; // Load css

    // Tell user which method they used
    respHtml += "<h1>Path: "+ req.path +" Method used: "+ req.method +"</h1>\n";

    // Add table of headers
    respHtml += makeTable(req.headers, "Header","Value");
    // Add table of queries
    respHtml += makeTable(req.query, "Query","Value");

    respHtml += "</body></html>";
    resp.set('Connection', 'close'); // Tell user to close connection
    resp.end(respHtml);
//    console.log("sent "+respHtml);
}

// DEBUG: Simply sends a "successful connection" response.
module.exports.sendSuccess = function(req, resp) {
    resp.set('Connection', 'close'); // Tell user to close connection
    resp.end("Connected to "+ req.originalUrl +" successfully via "+ req.method);
}
// Sends a 405 Method not allowed
module.exports.sendFail = function(req, resp) {
    resp.set('Connection', 'close'); // Tell user to close connection
    resp.status(405);
    resp.end("405 Method '"+ req.method +"' not allowed");
}
// Reject all requests to home page
module.exports.sendHome = function(req, resp) {
    resp.set('Connection', 'close'); // Tell user to close connection
    resp.status(403);
    resp.end('403 Forbidden: Cannot connect to homepage.');
}
