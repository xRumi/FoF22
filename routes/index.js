const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    messages = require('./messages'),
    search = require('./search'),
    menu = require('./menu');

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, c_page: 'home' });
    else res.status(403).redirect('/login');
});

router.get('/logs', async (req, res) => {
  const a = [
      {
        name: 'ping',
        author: 'rumi#9990',
        author_id: '792328424248442900'
      },
      {
        name: 'hello',
        author: 'rumi#9990',
        author_id: '792328424248442900'
      },
      {
        name: 'ban',
        author: 'rumi#9990',
        author_id: '792328424248442900'
      },
      {
        name: 'kick',
        author: 'rumi#9990',
        author_id: '792328424248442900'
      }
    ]
  res.status(200).send(JSON.stringify(a))
})

router.get('/fetch', async (req, res) => {
    if (req.user) {
        res.status(200).send('this is home page');
    } else res.status(403).send('forbidden');
});

router.use('/auth', auth);
router.use('/profile', profile);
router.use('/messages', messages);
router.use('/search', search);
router.use('/menu', menu);

router.get('/login', async (req, res) => {
    if (!req.user) res.render("login");
    else res.redirect('/');
});

router.get('/logout', async (req, res) => {
    if (req.user) await req.session.destroy();
    res.redirect('/login');
});

module.exports = router;