// The main server side script

// var express = require('express');
// var app = express();
// var server = require('http').createServer(app);

var server = require("live-server");
 
var params = {
    port: 8080, // Set the server port. Defaults to 8080.
    host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    root: "/public", // Set root directory that's being served. Defaults to cwd.
    open: false, // When false, it won't load your browser by default.
    ignore: 'scss,my/templates', // comma-separated string for paths to ignore
    file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
    wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
    mount: [['/components', './node_modules']], // Mount a directory to a route.
    logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
    middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
};
server.start(params);

// var server = require('http').createServer(app).listen(8080);

// var socket = require('socket.io');
// var io = socket().listen(server);


const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ['GET', 'POST'],
    }
});

io.sockets.on('connection', function (socket) {
    console.log('connected to client!!!');
});

console.log('this code is running, right?');