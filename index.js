(function() {

    'use strict';

    // application requirements
    var express = require('express');
    var app = express();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);
    var uuid = require('uuid');

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
        var user;
        socket.on('register', function(data, callback) {
            user = data.username;
            if (get_socket_for_user(user) !== fake_socket) {
                var reason = '"' + user + '" is already registered';
                callback(reason);
            }
            else {
                users[user] = socket;
                callback(null, {'username':user, 'currentState':current_state, 'uuid':uuid.v4()});
            }
        });
        socket.on('guess', function(data) {
            guesses[data.colour] = user;
        });
        socket.on('disconnect', function() {
            delete(users[user]);
        });
    });


    // map of username to socket
    var users = {};

    // map of colour to user
    var guesses = {};

    // current state of play
    var current_state = 'open';

    // fake socket returned when a user doesn't exist
    var fake_socket = {emit: function() {}};

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

    function get_socket_for_user(user) {
        return users[user] || fake_socket;
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

    function send_to_user(user, event, data) {
        var socket = get_socket_for_user(user);
        socket.emit(event, data);
    }

    function send_result_to_all_users() {
        var colour = choose_colour();
        var winner = who_got_closest(colour);
        send_to_all_users('result', {winner: winner, colour:colour});
        send_to_user(winner, 'winner');
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
