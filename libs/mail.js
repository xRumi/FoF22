const fetch = require("node-fetch");
const auth = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64');
const FormData = require("form-data");
const mailgunAPI = `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN_NAME}/messages`;

module.exports = (client) => {
    client.mail.send = async (data, callback) => {
        const formData = new FormData();
        for (let key in data) formData.append(key, data[key]);
        fetch(mailgunAPI, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + auth
            },
            body: formData
        }).then(res => res.json()).then(body => {
            console.log(body);
            callback(body.id ? true : false);
        }).catch(err => {
            console.log(err);
            callback(false);
        });
    }
}
