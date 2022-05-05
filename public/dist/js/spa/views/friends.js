import Constructor from "./constructor.js";

let _ajax0 = false, old_friends_list = [], update_next_time = false;

const people_list = (new_friends_list) => {
    if (!update_next_time && new_friends_list && JSON.stringify(new_friends_list) == JSON.stringify(old_friends_list)) return false;
    if (new_friends_list) old_friends_list = new_friends_list; update_next_time = false;
    if (old_friends_list && old_friends_list.length && Array.isArray(old_friends_list)) $('.fr-req-items').html(old_friends_list.map(x => {
        return $(`
            <div class="fr-req-item">
                <div class="fr-req-img">
                    <img src="/dist/img/users/${x.id}/profile.png">
                </div>
                <div class="fr-req-content">
                    <div>${x.name || 'No Username'}</div>
                    <span>@${x.username}</span>
                </div>
                <div class="fr-req-btn-group">
                    <button class="pc-user-add-friend" id="fr-req-accept">Accept</button>
                    <button class="pc-user-message" id="fr-req-reject">Reject</button>
                </div>
            </div>
        `).on('click', '#fr-req-accept', e => accept_friend_request(e, x)).on('click', '#fr-req-reject', e => cancel_friend_request(e, x));
    }));
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
                    if (!result.length) $('.fr-req-items').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
                    else people_list(result);
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
        return `<div class="friends">
            <div class="fr-req">
                <div class="fr-req-header">Friend Requests</div>
                <div class="fr-req-items">
                    <span style="position: absolute; margin: 25px;">Loading..</span>
                </div>
            </div>
        </div>`;
    }

    async after_render() {
        people_list();
    }
}

function accept_friend_request(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Accepting').css('opacity', '0.5');
    $('#fr-req-reject').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/accept`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Remove Friend').css('opacity', '1').attr('class', 'pc-user-remove-friend');
            $('#fr-req-reject').remove();
            that.off('click');
            that.on('click', (e) => remove_friend(e, x));
            update_next_time = true;
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Accept').css('opacity', '1');
            $('#fr-req-reject').prop('disabled', false).css('opacity', '1');
        },
    });
}

function cancel_friend_request(e, user_data) {
    let that = $(e.target), reject = that.text() == 'Reject';
    that.prop('disabled', true).text(reject ? 'Rejecting' : 'Cancelling').css('opacity', '0.5');
    $('#fr-req-accept').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/cancel`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('#fr-req-accept').remove();
            that.prop('disabled', true).text('Rejected');
            that.off('click');
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text(reject ? 'Reject' : 'Cancel Request').css('opacity', '1');
            $('#fr-req-accept').prop('disabled', false).css('opacity', '1');
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