const compression = require('compression'),
    express = require('express'),
    session = require('express-session'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

const passport = require('passport'),
    mongoose = require("mongoose"),
    redis_store = require('connect-redis')(session),
    local_strategy = require('./strategies/local'),
    routes = require('./routes');

require('dotenv').config();

const Redis = require('ioredis'),
    redis = new Redis(process.env.REDIS_CLOUD ? {
        port: 11017,
        host: 'redis-11017.c250.eu-central-1-1.ec2.cloud.redislabs.com',
        username: 'default',
        password: 'fdIiQeGANkVleapx3YnvND60zQiJAtXc'
    } : {});

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

mongoose.connect(`mongodb+srv://main:iVAFZ0z5YDcHf5jm@cluster0.pcm42.mongodb.net/${process.env.DEV ? 'dev' : 'main'}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() =>
    console.log('[MongoDB] connected')).catch((err) => 
    console.log(`[MongoDB] error: ${err}`));

const session_store = session({
    secret: '1p@d20&f#JtceK0jso,!h9&,7N@7@?',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
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

// client.database.user.find().then(users => users.forEach(user => user.save()));

require("./libs/ip")(client);
require("./libs/db")(client);
require("./libs/schedule")(client);
require("./libs/mail")(client);
require("./socket.io/index")(io, client);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

if (process.env.EXPRESS_STATIC) {
    app.use(express.static(path.join(__dirname, "/public")));
    console.log('[Express] serving static files');
}

app.use(session_store);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes(client));

if (process.env.DEV) {

    const fs = require('fs');

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