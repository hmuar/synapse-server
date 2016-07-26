var tap = require('tap');

var server = require("../server.js");
var FBmessage = require("../resource/fbmessage");

tap.test("FBmessage route GET", function(t) {
    var options = {
        method: "GET",
        url: FBmessage.getRoutePath("/api/v1") + "?hub.challenge=35",
    };
    // server.inject lets you similate an http request
    server.inject(options, function(response) {
        t.equal(response.statusCode, 200);  //  Expect http response status code to be 200 ("Ok")
        t.equal(response.result, 35); // Expect result to be "Hello Timmy!" (12 chars long)
        server.stop(t.end); // t.end() callback is required to end the test in tape
    });
});

tap.test("FBmessage route POST", function(t) {

    var msg = {
      "object":"page",
      "entry":[
        {
          "id":"PAGE_ID",
          "time":1460245674269,
          "messaging":[
            {
              "sender":{
                "id":"USER_ID"
              },
              "recipient":{
                "id":"PAGE_ID"
              },
              "timestamp":1460245672080,
              "message":{
                "mid":"mid.1460245671959:dad2ec9421b03d6f78",
                "seq":216,
                "text":"hello"
              }
            }
          ]
        }
      ]
    }

    var options = {
        method: "POST",
        url: FBmessage.getRoutePath("/api/v1"),
        payload: msg
    };
    // server.inject lets you similate an http request
    server.inject(options, function(response) {
        t.equal(response.statusCode, 200);  //  Expect http response status code to be 200 ("Ok")
        server.stop(t.end); // t.end() callback is required to end the test in tape
    });
});
