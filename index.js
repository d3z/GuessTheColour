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
            add_socket_for_user(user, socket);
            socket.emit('registered', {'username': user});
        });
        socket.on('guess', function(data) {
            guesses[data.username] = data.colour;
            console.log(guesses);
        });
    });

    io.on('disconnect', function(socket) {
    });


    // map of username to socket
    var users = {};

    // map of colour to user
    var guesses = {}; 

    // fake socket returned when a non-existing socket is requested
    var fake_socket = {emit: function(evt, data){}};


    // helper functions
    function start_new_round() {
        guesses = {};
        send_to_all_users('round', {'state':'open'});
    }

    function close_round() {
        send_to_all_users('round', {'state':'closed'});
    }

    function add_socket_for_user(user, socket) {
        users[user] = socket;
    }

    function get_socket_for_user(user) {
        return users[user] || fake_socket;
    }

    function send_to(socket, event, data) {
        socket.emit(event, data);
    }

    function send_to_all_users(event, data) {
        for (var user in users) {
            var socket = get_socket_for_user(user);
            send_to(socket, event, data);
        }
    }

    function send_result_to_all_users() {
        var colour = choose_colour();
        var winner = who_got_closest(colour);
        send_to_all_users('result', {winner: winner, colour:colour});
    }

    function choose_color() {
        return '#' + (Math.random() * 0XFFFFFF << 0).toString(16);
    }

    function who_got_closest(colour) {
    }


    // start the server
    var port = process.env.PORT || 4000;
    server.listen(port, function() {
        console.log('Guess The Colour server running on port %s', server.address().port);
    });

})();
