const mailgun = require("mailgun-js")({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.DOMAIN
});

module.exports = (client) => {
    client.mail.send = async (data, callback) => {
        mailgun.messages().send(data, (error, body) => callback(body.id ? true : false));
    }
}
