(function() {

    'use strict';

    // application requirements
    var express = require('express');
    var app = express();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);    

    // configure the app
    app.use(express.static(__dirname + '/public'))


    // application endpoints
    app.get('/new_round', function(req, res) {
        start_new_round();
        res.status(200).send('OK');
    });

    app.get('/close_round', function(req, res) {
        close_round();
        res.status(200).send('OK');
    });

    app.get('/finish_round', function(req, res) {
        send_result_to_all_users();
        res.status(200).send('OK');
    });


    // handle websocket connections
    io.on('connection', function(socket) {
        socket.on('register', function(data) {
            var user = data.username;
            users[user] = socket;
            socket.emit('registered', {'username': user, 'currentState': current_state});
        });
        socket.on('guess', function(data) {
            guesses[data.colour] = data.username;
        });
    });


    // map of username to socket
    var users = {};

    // map of colour to user
    var guesses = {}; 

    // current state of play
    var current_state = 'open';


    // helper functions
    function start_new_round() {
        guesses = {};
        current_state = 'open';
        send_to_all_users('round', {'state':'open'});
    }

    function close_round() {
        current_state = 'closed';
        send_to_all_users('round', {'state':'closed'});
    }

    function send_to(socket, event, data) {
        socket.emit(event, data);
    }

    function send_to_all_users(event, data) {
        for (var user in users) {
            var socket = users[user];
            send_to(socket, event, data);
        }
    }

    function send_result_to_all_users() {
        var colour = choose_colour();
        var winner = who_got_closest(colour);
        send_to_all_users('result', {winner: winner, colour:colour});
    }

    function choose_colour() {
        var colour = '#' + (Math.random() * 0XFFFFFF << 0).toString(16);
        if (colour.length === 6) colour += "0";
        return colour;
    }

    function who_got_closest(colour) {
        var colours = [colour];
        for (var color in guesses) {
            colours.push(color);
        }
        colours.sort();
        var ind = colours.indexOf(colour);
        return ind > 0 ? guesses[colours[ind-1]] : 'nobody';
    }


    // start the server
    var port = process.env.PORT || 4000;
    server.listen(port, function() {
        console.log('Guess The Colour server running on port %s', server.address().port);
    });

})();
