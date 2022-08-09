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

const days = ["Sunday", "Monday", "Tuesday", "Wednesday ", "Thursday", "Friday", "Saturday"];

const notifications_list = (new_notifications) => {
    if (new_notifications && JSON.stringify(new_notifications) == JSON.stringify(old_notifications)) return false;
    if (new_notifications) old_notifications = new_notifications;
    if (old_notifications && old_notifications.length && Array.isArray(old_notifications)) $('.notifications-list').html(old_notifications.map(x => {
        return $(`
            <div class="notifications-item${x.unread ? ' nic-unread' : ''}" data-id="${x.id}">
                <div class="notifications-item-img">
                    <img src="${x.image}">
                </div>
                <div class="notifications-item-content">
                    <div class="nic-title">${x.title}</div>
                    <span class="nic-time">${parse_message_time(x.time, true)}</span>
                </div>
            </div>
        `).on('click', e => {
            $.ajax({
                type: 'POST',
                url: `/notifications/read`,
                timeout: 30000,
                data: {
                    id: x.id,
                },
                success: function(result, textStatus, xhr) {
                    if (!x.navigate_to) {
                        old_notifications.find(y => y.id == x.id).unread = false;
                        $(e.currentTarget).removeClass('nic-unread');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    /* do something */
                }
            });
            if (x.navigate_to) {
                old_notifications.find(y => y.id == x.id).unread = false;
                $(e.currentTarget).removeClass('nic-unread');
                $.fn.navigate_to(x.navigate_to);
            }
        });
    }));
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Notification");
        navbar('#nav__link__notifications', true);
        if (!_ajax0) {
            _ajax0 = true;
            nanobar.go(30);
            $.ajax({
                type: 'GET',
                url: `/notifications/fetch`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    if (!result.mm && !result.notifications.length) $('.notifications-list').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
                    else notifications_list(result.notifications);
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
        return $(`
            <div class="notifications">
                <div class="notifications-header">
                    <div>Notifications</div>
                    <i class='bx bx-envelope' title="Mark As Read"></i>
                </div>
                <div class="notifications-list">
                    <span style="position: absolute; margin: 25px;">Loading..</span>
                </div>
            </div>
        `).on('click', '.notifications-header i', e => {
            $.ajax({
                type: 'POST',
                url: `/notifications/read_all`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    old_notifications.filter(y => y.unread).forEach(y => {
                        y.unread = false;
                        $('.notifications-item').removeClass('nic-unread');
                    });
                },
                error: function(xhr, textStatus, errorThrown) {
                    /* do something */
                }
            });
        });
    }

    async after_render() {
        notifications_list();
    }
}

function parse_message_time(message_time, minimal) {
    let _time = new Date(message_time),
        diff = Math.abs(Date.now() - message_time), time;
    if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
    else if (diff < periods.day && _time.getDate() === today.getDate()) time = `${!minimal ? `Today at ` : ''}${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
    else {
        if (diff < periods.week) time = `${days[_time.getDay()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}`;
        else time = `${_time.getDate()} ${months[_time.getMonth()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}${_time.getFullYear() !== today.getFullYear() ? `, ${_time.getFullYear()}` : ''}`
    }
    return time;
}
