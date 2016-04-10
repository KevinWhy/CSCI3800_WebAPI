For Assignment 4, the postman collection has 3 sub-folders:
	DEBUG_BaaS Tests - Feel free to ignore this folder. This s just some HTTP requests to usergrid.
	Proxy_Test Fails - Tests in this folder make the proxy return some kind of error.
	Proxy_Test Successful - Tests in this folder are valid requests to the proxy.
It also has a 'Reset Movie Collection' test. If the collection is messed up somehow, run this test to fix it.

The successful tests that run on one movie use the environment variable 'movieUUID'
Before running 'Get a Movie', 'Change a Movie', or 'Delete a Movie'; you should run the 'Add a Movie' test.