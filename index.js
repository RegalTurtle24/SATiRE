// The main server side script

var app = express();

var server = require('http').createServer(app).listen(8080);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log('connected to client!!!');
});
