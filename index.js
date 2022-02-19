const compression = require('compression'),
    express = require('express'),
    session = require('express-session'),
    app = express();
    
const http = require('http').Server(app);
const io = require('socket.io')(http);

const passport = require('passport'),
    mongoose = require("mongoose"),
    mongo_store = require('connect-mongo'),
    local_strategy = require('./strategies/local'),
    routes = require('./routes/');

const path = require('path');
const logger = require("morgan");

app.use(logger("dev"));

mongoose.connect('mongodb+srv://main:iVAFZ0z5YDcHf5jm@cluster0.pcm42.mongodb.net/main?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).catch((err) => {
    return console.log(`MongoDB database error: ${err}`);
});

const session_store = session({
    secret: '1p@d20&f#JtceK0jso,!h9&,7N@7@?',
    cookie: { maxAge: 60000 * 60 * 24 },
    resave: false,
    saveUninitialized: false,
    store: mongo_store.create({ mongoUrl: 'mongodb+srv://main:iVAFZ0z5YDcHf5jm@cluster0.pcm42.mongodb.net/main?retryWrites=true&w=majority' }),
    unset: 'destroy'
});

io.use(function(socket, next) {
    session_store(socket.request, socket.request.res || {}, next);
});

const client = {};

client.database = {};
client.database.user = require("./models/User");
client.database.room = require("./models/Room");
client.database.chat = require("./models/Chat");
client.database.token = require("./models/Token");
client.database.functions = {};

client.database_cache = {};
client.database_cache.users = new Map();
client.database_cache.rooms = new Map();

client.cache = {};
client.cache.functions = {};
client.cache.users = new Map();

require("./functions/db")(client);
require("./libs/schedule")(client);
require("./functions/cache")(client);

require("./libs/socket-io.js").sockets(io, client);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")/*, { maxAge: process.env.NODE_ENV === 'production' ? 60000 * 60 * 24 : 0 } */));
app.set("views", path.join(__dirname, "/views"));

app.use(session_store);

app.use(passport.initialize());
app.use(passport.session());

app.use(async function(req, res, next) {
    req.client = client;
    next();
});

app.use('/', routes);

const func = async () => {
    //const room = await client.database.functions.get_message_room('61cc4c4363fd215377b41da1');
    //const room = await client.database.functions.create_room('console', ['rumi', 'system']);
    //const room = await client.database.room.find({ type: 'private', members: {$in: ['1234', '5678']} });
    //console.log(await client.database.chat.findById('61d00496cd80afdc9c2e7242'));
    const friend = await client.database.functions.get_user('shanto');
    const user = await client.database.functions.get_user('rumi');
    user.friends = [friend.username];
    await user.save();
    console.log(user);
}

//func();

const server = http.listen(80, () => {
    console.log('server is running on port', server.address().port);
});

local_strategy.init(client);
client.database.functions.schedule();