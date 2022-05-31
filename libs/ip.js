const geoip = require('fast-geoip');

module.exports = function (client) {
    client.get_ip_info = async (req) => {
        let xForwardedFor = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
        let ip = xForwardedFor || req.connection.remoteAddress;
        if (ip.includes('::ffff:')) ip = ip.split(':').reverse()[0];
        let looked_up_ip = await geoip.lookup(ip);
        if (ip == '127.0.0.1' || ip == '::1') return { error: "This won't work on localhost" };
        if (!looked_up_ip) return { error: "Error occured while trying to process the information" };
        looked_up_ip.ll = looked_up_ip.ll.reverse();
        return looked_up_ip;
    }
}
