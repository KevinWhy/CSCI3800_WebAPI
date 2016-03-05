var express = require('express');
var app = express();
var sendResponses = require('./sendResp.js'); // use a separate file to actually send the responses.

// Reject all requests to home page
app.get('/', sendResponses.sendHome);

// A list of webpages, and the request that page accepts.
var webpages = ['/gets', '/posts', '/puts', '/deletes'];
var reqMethod = ['GET', 'POST', 'PUT', 'DELETE'];
// Only let requests through if request was sent with proper method...
app.all(webpages, function(req, resp, next) {
  // If page was requested with proper method, let it through
  var urlIndex = webpages.indexOf(req.path); // Sent to console.log
  if (urlIndex != -1 && urlIndex == reqMethod.indexOf(req.method)) {
    console.log("user connected to "+ req.path +" originalUrl: "+ req.originalUrl +" via "+ req.method);
    next();
  } else { // Otherwise, send 405
    console.log("user failed to connect to "+ req.path +" originalUrl: "+ req.originalUrl +" via "+ req.method);
//    sendFail(req, resp);
    sendResponses.sendFail(req, resp);
  }
}, sendResponses.sendHeaders);

module.exports = app; // www.js requires app
console.log('Connect to http://localhost:3000');
