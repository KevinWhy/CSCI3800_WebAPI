/*
 * This file renders the forms for the website.
 * Created by oKevi on 4/25/2016.
 */

var express = require('express');
var http = require('http');
var util = require('util');
var router = express.Router();

/*
 * When user GETs the buy form, tell them if they can/can't buy an item
 */
router.get('/buy', function(req, res, next) {
    var ipAddr = req.ip;
    // DEBUG: if IP Address was specified, use that one instead
    if (typeof(req.query.ip) == 'string')
        ipAddr = req.query.ip;

    console.log('Getting form: buy__ip='+ ipAddr); // DEBUG
    canBuy(ipAddr, function(buyStatus) {
        res.render('buy', {
            canBuy: buyStatus,
            ip: ipAddr
        });
        res.end();
    });
});

/*
 * When user posts the form, show the params given
 */
router.post('/form', function(req, res, next) {
    var ipAddr = req.ip;
    if (req.body.ip) // DEBUG: Allow user to buy from a different IP address
        ipAddr = req.body.ip;

    console.log('POSTing form: form__ip='+ ipAddr); // DEBUG
    canBuy(ipAddr, function(buyStatus) {
        res.render('formPost', {
            fname: req.body.fname,
            lname: req.body.lname,
            canBuy: buyStatus
        });
        res.end();
    });
});

/**
 * Checks if user can buy something.
 * @param ipAddress IP address to check. Should be a readable string.
 * @param callback Function to call. Should have param(result)... result = true/false
 */
function canBuy(ipAddress, callback) {
    var options = {
        hostname: 'tr1alanderr0r-test.apigee.net',
        path: '/checkcountry?'+ ipAddress
    };

    // Send the IP request
//    console.log('Sending IP check...'+ options.path); // DEBUG
    var ipReq = http.request(options, function(res) {
        var data = '';
        res.on('data', function(newData) {
            data += newData;
//            console.log(util.format('\t'+ ipAddress +'_Got response: %s', newData)); // DEBUG
        });
        res.on('end', function() {
//            console.log('\t'+ ipAddress +'_No more data...'); // DEBUG
//            console.log('\t'+ ipAddress +'_code:'+ res.statusCode +'_total: '+ data); // DEBUG
            var jsonData = JSON.parse(data);
            if (res.statusCode == 200 && typeof(jsonData) == 'boolean')
                callback(jsonData);
            else
                callback(false);
        });
    });
    ipReq.end();
}
// Test the canBuy...
var ips = ['128.0.0.0', '132.194.7.45', '212.58.246.54'];
for (var index in ips) {
    (function(ipAddr) {
        canBuy(ipAddr, function(status) {
            console.log('\tChecking '+ ipAddr +': '+status);
        });
    })(ips[index]);
}

module.exports = router;
