const compression = require('compression'),
    express = require('express'),
    session = require('express-session'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

const passport = require('passport'),
    mongoose = require("mongoose"),
    mongo_store = require('connect-mongo'),
    local_strategy = require('./strategies/local'),
    routes = require('./routes/');

const path = require('path');
app.set('trust proxy', true);

mongoose.connect('mongodb+srv://main:iVAFZ0z5YDcHf5jm@cluster0.pcm42.mongodb.net/main?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('database is connected');
}).catch((err) => {
    return console.log(`MongoDB database error: ${err}`);
});

const session_store = session({
    secret: '1p@d20&f#JtceK0jso,!h9&,7N@7@?',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
    resave: false,
    saveUninitialized: false,
    store: mongo_store.create({ mongoUrl: 'mongodb+srv://main:iVAFZ0z5YDcHf5jm@cluster0.pcm42.mongodb.net/main?retryWrites=true&w=majority' }),
    unset: 'destroy'
});

const nodemailer = require('nodemailer');

io.use(function(socket, next) {
    session_store(socket.request, socket.request.res || {}, next);
});

const client = {};

client.database = {};
client.database.user = require("./models/User");
client.database.room = require("./models/Room");
client.database.chat = require("./models/Chat");
client.database.token = require("./models/Token");
client.database._user = require("./models/_User");
client.database.functions = {};

client.database_cache = {};
client.database_cache.users = new Map();
client.database_cache.rooms = new Map();

client.cache = {};
client.cache.functions = {};
client.cache.users = new Map();

client.transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
        user: 'mehedihasanrumi@yahoo.com',
        pass: 'udxiaghwxqrvzadq'
    }
});

require("./functions/db")(client);
require("./libs/schedule")(client);
require("./functions/cache")(client);

require("./libs/socket-io.js").sockets(io, client);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

if (process.env.EXPRESS_STATIC) {
    app.use(express.static(path.join(__dirname, "/public")));
    console.log('serving static files through express');
}

app.use(session_store);

app.use(passport.initialize());
app.use(passport.session());

app.use(async function(req, res, next) {
    req.client = client;
    req.io = io;
    next();
});

app.use('/', routes);

app.get('*', (req, res) => {
    res.render('404');
});

const server = http.listen(process.env.PORT || 3000, () => {
    console.log('server is running on port', server.address().port);
});

local_strategy.init(client, app);
client.database.functions.schedule();
