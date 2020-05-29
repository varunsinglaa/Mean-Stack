const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('./config/database');
let io = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
io = io.listen(server);
const users = [];
const connections = [];

mongoose.connect(config.database);

mongoose.connection.on("connected", () => {
    console.log("Connected to Database " + config.database);
});

mongoose.connection.on("err", (err) => {
    console.log(err);
});

const port = 3000;

const user = require('./routes/users');

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

app.use('/users', user);

app.get('/', (req, res) => {
    res.send("home page")
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', function(socket) {
    connections.push(socket);
    console.log('Connected: ' + connections.length);

    socket.on('disconnect', (data) => {
        users.splice(users.indexOf(socket.username), 1);
        updateUsername();
        connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('message', function(data){
        io.emit('message', {msg: data, user: socket.username});
    });

    // Adding New User
    socket.on('newUser', (data) => {
        socket.username = data;
        if(users.indexOf(socket.username) == -1) {
            users.push(socket.username);
        }
        updateUsername();
    });

    function updateUsername() {
        io.sockets.emit('getUsers', users);
    }
});
server.listen(process.env.PORT || port, () => {
    console.log("Server Starting on port " + port +"/"+process.env.PORT);
});