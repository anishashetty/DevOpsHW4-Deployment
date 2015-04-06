var http      = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis');

var GREEN = 'http://127.0.0.1:5060';
var BLUE  = 'http://127.0.0.1:9090';
var clientBlue = redis.createClient(6379, '127.0.0.1', {})
var clientGreen = redis.createClient(6380, '127.0.0.1', {})
var TARGET = BLUE;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);

    var server  = http.createServer(function(req, res)
    {
      if(req.url == '/switch'){

        if(TARGET == BLUE){

        TARGET=GREEN
        //
      }
        else{
        TARGET=BLUE
        //
      }
      }
      console.log('TARGET: '+TARGET)
      proxy.web( req, res, {target: TARGET } );
    });
    server.listen(8080);

    exec('redis-server --port 6379')
    exec('redis-server --port 6380')
    // Launch green slice
    exec('forever start ../deploy/blue-www/main.js 9090 6379');
    console.log("blue slice");

    // Launch blue slice
    exec('forever start ../deploy/green-www/main.js 5060 6380');
    console.log("green slice");


  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
}

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.log(err);
  infrastructure.teardown();} );
