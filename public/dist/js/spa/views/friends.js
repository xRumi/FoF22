import Constructor from "./constructor.js";

let _ajax0 = false,
    _ajax1 = false,
    old_friends_list = [],
    old_nearby_friends_list = [],
    update_next_time0 = false,
    update_next_time1 = false;

const nearby_people_list = (new_nearby_friends_list, callback) => {
    if (!update_next_time1 && new_nearby_friends_list && JSON.stringify(new_nearby_friends_list) == JSON.stringify(old_nearby_friends_list)) return false;
    if (new_nearby_friends_list) old_nearby_friends_list = new_nearby_friends_list; update_next_time1 = false;
    if (old_nearby_friends_list && old_nearby_friends_list.length && Array.isArray(old_nearby_friends_list)) $('.fr-nearby-items').html(old_nearby_friends_list.map(x => {
        return $(`
            <div class="fr-nearby-item">
                <div class="fr-nearby-img">
                    <img src="/dist/img/users/${x.id}/profile.png">
                </div>
                <div class="fr-nearby-content">
                    <div>${x.name || 'No Username'}</div>
                    <span>@${x.username}</span>
                </div>
                <div class="fr-nearby-btn-group">
                    <button class="pc-user-add-friend">Add Friend</button>
                    <button class="pc-user-message">Remove</button>
                </div>
            </div>
        `).on('click', '.fr-nearby-img, .fr-nearby-content', () => $.fn.navigateTo(`/spa/profile/${x.id}`))
            .on('click', '.pc-user-add-friend', e => add_friend(e, x))
            .on('click', '.pc-user-message', e => remove_nearby(e, x));
    }));
    else return;
    if (callback) callback();
}

const req_people_list = (new_friends_list, callback) => {
    if (!update_next_time0 && new_friends_list && JSON.stringify(new_friends_list) == JSON.stringify(old_friends_list)) return false;
    if (new_friends_list) old_friends_list = new_friends_list; update_next_time0 = false;
    if (old_friends_list && old_friends_list.length && Array.isArray(old_friends_list)) $('.fr-req-items').html(old_friends_list.map(x => {
        return $(`
            <div class="fr-req-item">
                <div class="fr-req-img">
                    <img src="/dist/img/users/${x.id}/profile.png">
                </div>
                <div class="fr-req-time">${fr_req_time(x.created_at)}</div>
                <div class="fr-req-content">
                    <div>${x.name || 'No Username'}</div>
                    <span>${x.mutual.count ? `${x.mutual.count} mutual friend${x.mutual.count > 1 ? 's' : ''}` : ``}</span>
                </div>
                <div class="fr-req-btn-group">
                    <button class="pc-user-add-friend" id="fr-req-accept">Accept Friend</button>
                    <button class="pc-user-message" id="fr-req-reject">Reject</button>
                </div>
            </div>
        `).on('click', '.fr-req-img, .fr-req-content', () => $.fn.navigateTo(`/spa/profile/${x.id}`)).on('click', '#fr-req-accept', e => accept_friend_request(e, x)).on('click', '#fr-req-reject', e => cancel_friend_request(e, x));
    }));
    else return;
    if (callback) callback();
}

function fr_req_time(time_) {
    let _time = new Date(time_),
        diff = Math.abs(Date.now() - _time);
    return Math.floor(diff / periods.week) ? Math.floor(diff / periods.week) + 'week ago' : Math.floor(diff / periods.day) ? Math.floor(diff / periods.day) + 'd ago' : Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Friends");
        navbar('#nav__link__friends', true);
        if (!_ajax0) {
            _ajax0 = true;
            nanobar.go(30);
            $.ajax({
                type: 'GET',
                url: `/friends/fetch`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    if (result.requests && result.requests.length) {
                        req_people_list(result.requests, () => { if (result.total_request_count > 10) $('.fr-req-show-more').show() }); 
                    } else $('.fr-req-items').html(`<span style="display: block; padding: 12px;">You do not have any friend request</span>`);
                    if (result.nearby && result.nearby.length) {
                        nearby_people_list(result.nearby, () => { if (result.nearby.length > 9) $('.fr-nearby-show-more').show() });
                    } else $('.fr-nearby-items').html(`<span style="display: block; padding: 12px;">There is no nearby users in your area</span>`);
                    _ajax0 = false;
                    nanobar.go(100);
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert('uhh')
                    _ajax0 = false;
                },
            });
        } 
    }

    async render() {
        return $(`<div class="friends">
            <div class="fr-req">
                <div class="fr-req-header">Friend Requests</div>
                <div class="fr-req-items">
                    <svg class="spinner" style="position: relative; width: 30px; height: 30px; margin: 12px;" viewBox="0 0 50 50">
                        <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                    </svg>
                </div>
                <div class="fr-req-show-more" style="display: none;">
                    Show More
                    <svg class="spinner" style="position: relative; margin-bottom: -6px; width: 20px; height: 20px; margin-left: 10px; display: none;" viewBox="0 0 50 50">
                        <circle class="spinner-path" style="stroke: black;" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                    </svg>
                </div>
            </div>
            <div class="fr-nearby">
                <div class="fr-nearby-header">You May Know</div>
                <div class="fr-nearby-items">
                    <svg class="spinner" style="position: relative; margin-bottom: -6px; width: 30px; margin: 12px;" viewBox="0 0 50 50">
                        <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                    </svg>
                </div>
                <div class="fr-nearby-show-more" style="display: none;">
                    Show More
                    <svg class="spinner" style="width: 20px; height: 20px; margin-left: 10px; display: none" viewBox="0 0 50 50">
                        <circle class="spinner-path" style="stroke: black;" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                    </svg>
                </div>
            </div>
        </div>`).on('click', '.fr-req-show-more', (e) => { $(e.currentTarget).find('svg').show(); })
            .on('click', '.fr-nearby-show-more', (e) => { $(e.currentTarget).find('svg').show(); });
    }

    async after_render() {
        req_people_list();
        nearby_people_list();
    }
}

function add_friend(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Sending').css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/add`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Cancel Request').css('opacity', '1').attr('class', 'pc-user-friend-request');
            that.off('click');
            that.on('click', (e) => cancel_friend_request(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Add Friend').css('opacity', '1');
        },
    });
}

function accept_friend_request(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Accepting').css('opacity', '0.5');
    that.parent().find('#fr-req-reject').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/accept`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Remove Friend').css('opacity', '1').attr('class', 'pc-user-remove-friend');
            that.parent().find('#fr-req-reject').remove();
            that.off('click');
            that.on('click', (e) => remove_friend(e, user_data));
            update_next_time0 = true;
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Accept Friend').css('opacity', '1');
            that.parent().find('#fr-req-reject').prop('disabled', false).css('opacity', '1');
        },
    });
}

function cancel_friend_request(e, user_data) {
    let that = $(e.target), reject = that.text() == 'Reject';
    that.prop('disabled', true).text(reject ? 'Rejecting' : 'Cancelling').css('opacity', '0.5');
    that.parent().find('#fr-req-accept').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/cancel`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.parent().find('#fr-req-accept').remove();
            that.prop('disabled', true).text(reject ? 'Rejected' : 'Cancelled');
            that.off('click');
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text(reject ? 'Reject' : 'Cancel Request').css('opacity', '1');
            that.parent().find('#fr-req-accept').prop('disabled', false).css('opacity', '1');
        },
    });
}

function remove_friend(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Removing').css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/remove`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.parent().parent().remove();
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Remove Friend').css('opacity', '1');
        },
    });
}

function remove_nearby(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Removing').css('opacity', '0.5');
    that.parent().find('.pc-user-add-friend').prop('disabled', true);
    $.ajax({
        type: 'POST',
        url: `/friends/nearby/remove`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.parent().find('.pc-user-add-friend').hide();
            that.prop('disabled', false).text('Undo Remove').css('opacity', '1');
            that.off('click');
            that.on('click', e => undo_nearby_remove(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Remove').css('opacity', '1');
        },
    });
}

function undo_nearby_remove(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Undoing').css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/nearby/undo-remove`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.parent().find('.pc-user-add-friend').show();
            that.prop('disabled', false).text('Remove').css('opacity', '1');
            that.off('click');
            that.on('click', e => remove_nearby(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Undo Remove').css('opacity', '1');
        },
    });
}
