const mailgun = require("mailgun-js")({
    apiKey: 'e7b233eec7e60c9a7ce55f0bae392c4f-77985560-6b600cad',
    domain: 'fof22.me'
});

module.exports = (client) => {
    client.mail.send = async (data, callback) => {
        mailgun.messages().send(data, (error, body) => callback(body.id ? true : false));
    }
}
