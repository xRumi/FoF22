import Constructor from "./constructor.js";

let _ajax0 = false, old_notifications = [], today = new Date();

const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

const notifications_list = (new_notifications) => {
    if (new_notifications && JSON.stringify(new_notifications) == JSON.stringify(old_notifications)) return false;
    if (new_notifications) old_notifications = new_notifications;
    if (old_notifications && old_notifications.length && Array.isArray(old_notifications)) $('.notifications-list').html(old_notifications.map(x => {
        let diff = Date.now() - x.time, time,
            _time = new Date(parseInt(x.time));
        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
        else if (diff < periods.day && _time.getDate() === today.getDate()) time = _time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        else {
            let _time = new Date(x.time);
            if (diff < periods.week) time = days[_time.getDay()];
            else time = _time.toLocaleDateString();
        }
        return $(`
            <div class="notifications-item">
                <div class="notifications-item-img">
                    <img src="/dist/img/users/${x.user_id}/profile.png">
                </div>
                <div class="notifications-item-content">
                    <div class="nic-title">${x.title}</div>
                    <div class="nic-detail">${x.detail}</div>
                    <span class="nic-time">${time}</span>
                </div>
            </div>
        `).on('click', e => $.fn.navigateTo(x.navigateTo));
    }));
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Notification");
        navbar('#nav__link__notifications', true);
        if (!_ajax0) {
            _ajax0 = true;
            nanobar.go(30);
            $.ajax({
                type: 'GET',
                url: `/notifications/fetch`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    console.log(result);
                    if (!result.length) $('.notifications-list').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
                    else notifications_list(result);
                    _ajax0 = false;
                    nanobar.go(100);
                },
                error: function(xhr, textStatus, errorThrown) {
                    /* do something */
                    _ajax0 = false;
                },
            });
        }
    }

    async render() {
        return `
            <div class="notifications">
                <div class="notifications-header">Notifications</div>
                <div class="notifications-list">
                    <span style="position: absolute; margin: 25px;">Loading..</span>
                </div>
            </div>
        `;
    }

    async after_render() {
        notifications_list();
    }
}
