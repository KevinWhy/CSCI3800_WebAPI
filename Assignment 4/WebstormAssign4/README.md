Apigee-127 project for Assignment 4.
You can GET, POST, PUT, and DELETE to movies.
You can also GET, PUT, and DELETE individual movies by their UUID.

For queries that modify/delete several movies, they return a list of responses used on that operation.
I also have a reset movies action.
    When called, the collection is set to a default list of 5 movies:
        - testA
        - testB
        - Slow and Serious
        - Outside In
        - Castle Mashers
    It sends the response it got for the delete in 'deleteResp'...
    and the list of responses when it added the list of movies above in 'addResp'