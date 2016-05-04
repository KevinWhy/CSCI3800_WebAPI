/*
 * This file sends all the static pages.
 */

var express = require('express');
var util = require('util');
var sharedVars = require('./sharedVars');
var router = express.Router();

// List of pages to route
var staticPages = [
    '/about',
    '/support',
    {path:['/home','/'], page:'home'} // Allow '/' and 'index' to route to same page
];

// Route all the pages listed above
console.log('Making routes:');
for (var index in staticPages) {
    var currPage = staticPages[index];

    // Keep a reference to currPage in router.get
    (function (currPage) {
        if (typeof(currPage) == 'string') { // If it's just a normal page...
            console.log('\tstr: '+ currPage);
            router.get(currPage, function(req, res, next) { // Route using the string
                console.log('Getting page: '+ currPage);

                var dotIndex = currPage.lastIndexOf('\.');
                var pageName = (dotIndex >= 0) ? currPage.substr(1, dotIndex-1) : currPage.substr(1);
                res.render(pageName, sharedVars);
                res.end();
            });

        } else { // If have specifications for this page...
            console.log(util.format('\tobj: %j', currPage));
            router.get(currPage.path, function(req, res, next) { // Route using currPage.path
                console.log(util.format('Getting obj: %j', currPage));
                res.render(currPage.page, sharedVars);
                res.end();
            });
        }
    })(staticPages[index]);
}

module.exports = router;
