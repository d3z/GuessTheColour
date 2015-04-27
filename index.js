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
    app.get('/open_round', function(req, res) {
        send_to_all_users('open_round');
        res.status(200).send('OK');
    });

    app.get('/close_round', function(req, res) {
        send_to_all_users('close_round');
        res.status(200).send('OK');
    });

    app.get('/finish_round', function(req, res) {
        var color = choose_color();
        send_color_to_all_users(color);
        res.status(200).send('OK');
    });


    // handle websocket connections
    io.on('connection', function(socket) {
        socket.on('register', function(data) {
            var user = data.username;
            console.log('We have a new user:', user);
            add_socket_for_user(user, socket);
            socket.emit('registered', {'username': user});
        });
    });

    io.on('disconnect', function(socket) {
        console.log('Losing a connection');
    });


    // map of username to socket
    var users = {}

    // fake socket returned when a non-existing socket is requested
    var fake_socket = {emit: function(evt, data){}}


    // helper functions
    Array.prototype.remove = function(val) {
        var ind = this.indexOf(val);
        if (ind != -1) {
            delete(this[ind]);
        }
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

    function send_color_to_all_users(colour) {
        send_to_all_users('colour', {colour:colour});
    }

    function choose_color() {
    }


    // start the server
    var port = process.env.PORT || 4000;
    server.listen(port, function() {
        console.log('Guess The Colour server running on port %s', server.address().port);
    });

})();
