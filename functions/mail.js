const mailgun = require("mailgun-js")({
    apiKey: '7b1008a2957a7df5a3e41ef2d6f9fb33-fe066263-2a110285',
    domain: 'mail.fof22.me'
});

module.exports = (client) => {
    client.mail.send = async (data, callback) => {
        mailgun.messages().send(data, (error, body) => callback(body.id ? true : false));
    }
}
