const compression = require('compression'),
    express = require('express'),
    session = require('express-session'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

const passport = require('passport'),
    mongoose = require("mongoose"),
    redis_store = require('connect-redis').default,
    local_strategy = require('./strategies/local'),
    routes = require('./routes');

require('dotenv').config();

process.env.FILE_UPLOAD_SIZE_LIMIT = parseInt(process.env.FILE_UPLOAD_SIZE_LIMIT, 10);
console.log(process.FILE_UPLOAD_SIZE_LIMIT);

const Redis = require('ioredis'),
    redis = new Redis(process.env.DEV ? {
        port: process.env.REDIS_DEV_PORT,
        host: process.env.REDIS_DEV_HOST,
        username: process.env.REDIS_DEV_USERNAME,
        password: process.env.REDIS_DEV_PASSWORD
    } : {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    });

redis.on('connect', () => {
    console.log('[Redis] connected');
    redis.call('FT.INFO', 'users').catch(() => redis.call(
        'FT.CREATE', 'users', 'ON', 'JSON',
        'PREFIX', '1', 'user:', 'SCHEMA',
        '$.username', 'AS', 'username', 'TEXT',
        '$.email', 'AS', 'email', 'TEXT')
        .then(() => console.log('[Redis] users query index created'))
        .catch(err => console.log(`[Redis] ${err}`)));
}).on('error', err => console.log(`[Redis] ${err}`));

const path = require('path');
app.set('trust proxy', true);

mongoose.connect(process.env.DEV ? process.env.MONGODB_URL_DEV : process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() =>
    console.log('[MongoDB] connected')).catch((err) => 
    console.log(`[MongoDB] error: ${err}`));

const session_store = session({
    secret: process.env.SESSION_STORE_SECRET,
    cookie: { maxAge: 2 * 30 * 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
    store: new redis_store({ client: redis, prefix: 'session:' }),
    unset: 'destroy',
    name: 'auth'
});

io.use(function(socket, next) {
    session_store(socket.request, socket.request.res || {}, next);
});

const client = {};

client.mail = {};

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

client.io = io;
client.redis = redis;

require("./libs/ip")(client);
require("./libs/db")(client);
require("./libs/schedule")(client);
require("./libs/mail")(client);
require("./socket.io/index")(io, client, session_store);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

if (process.env.EXPRESS_STATIC) {
    console.log('[Express] serving static files');

    const fs = require('fs');

    app.use(express.static(path.join(__dirname, "/public")));

    app.get('/uploads/users/:id/profile.png', async (req, res) => {
        let id = req.params.id;
        if (fs.existsSync(path.join(__dirname, `/uploads/users/${id}/profile.png`)))
            res.sendFile(path.join(__dirname, `/public/uploads/users/${id}/profile.png`));
        else res.sendFile(path.join(__dirname, '/public/dist/img/default-profile.png'));
    });

    app.get('/uploads/users/:id/cover.png', async (req, res) => {
        let id = req.params.id;
        if (fs.existsSync(path.join(__dirname, `/uploads/users/${id}/cover.png`)))
            res.sendFile(path.join(__dirname, `/public/uploads/users/${id}/cover.png`));
        else res.sendFile(path.join(__dirname, '/public/dist/img/default-cover.png'));
    });
}

app.use(session_store);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes(client));

app.get('*', (req, res) => res.render('404'));

const server = http.listen(process.env.PORT || 3000, () =>
    console.log('[Express] on port', server.address().port));

local_strategy.init(client, app);
client.database.functions.schedule();

process.stdin.on('data', async data => {
    let input = data.toString().trim();
    if (input == 'clear') console.clear();
    else if (input.split(' ')[0] == 'js') (new Promise((resolve) => resolve(eval(input.split(' ').slice(1).join(' ')))))
        .then(console.log)
        .catch(console.log);
});

const common_notification_texts = {
    1: 'Your friend request to <b>%s</b> was accepted, say Hi to your new friend!',
    2: 'You are now friends with <b>%s</b>!'
}

client.common_notification_texts = common_notification_texts;

client.parse = function (str) {
    var args = [].slice.call(arguments, 1),
        i = 0;
    return str.replace(/%s/g, () => args[i++]);
}

client.esr = (str) => str.replace(/[|\\{}()[\]^$+*?.@]/g, '\\$&').replace(/-/g, '\\x2d');
