var express = require('express');
var url = require('url');
var app = express();
var request = require('request');
var parseString = require('xml2js').parseString;
app.use(express.bodyParser());

app.get('/', function(req, res) {
    var queryString = url.parse(req.url).query;
    var mainUrl = "http://www.webservicex.net/geoipservice.asmx/GetGeoIP?IPAddress=";
    var combUrl = mainUrl + queryString;

	request(combUrl, function (err, response, body) {
	    if(err) { res.send('Get Ip Error'); return; }
		else{
		    parseString(body, function (err, result) {
		        var countryName = result.GeoIP.CountryName[0]; 
		        
		        request("https://api.usergrid.com/tr1alanderr0r/sandbox/whitelists", function (err, response2, body2) {
		            if(err) { res.send('Get WhiteList Error'); return; }
		            else{
		                obj = JSON.parse(body2);  
		                var flag = false;
		                
                        for(var index = 0; index < obj.entities.length; index++)
                        {
                            if(countryName == obj.entities[index].name)
                            {
	    	                    flag = true;
                            }
                        }
                        res.send(flag);
                        
		            }
		        });
	            
            });
		}
	});
	

});

app.listen(process.env.PORT || 9000);
console.log('The server is running!');