import Constructor from "./constructor.js";

let _ajax0 = false, user_data;

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.set_title("Profile");
        if (!this.id || this.id == 'me') {
            this.id = client.id;
            history.pushState(null, null, `/spa/profile/${this.id}`);
        }
        if (!_ajax0) {
            _ajax0 = true;
            nanobar.go(30);
            $.ajax({
                type: 'GET',
                url: `/profile/fetch/${this.id || 'me'}`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    user_data = result;
                    _ajax0 = false;
                    document.title = user_data.name;
                    $('.profile').attr('data-id', user_data.id);
                    $('.profile-header p').text(user_data.name);
                    $('.pc-user-cover').css('background-image', `uploads/users/${user_data.id}/cover.png`);
                    $('.pc-user-img img').attr('src', `/uploads/users/${user_data.id}/profile.png`);
                    $('.pc-user-name div').text(user_data.name);
                    $('.pc-user-name span').text(`@${user_data.username}`);
                    let pc_user_btn_group = [];
                    if (user_data.id == client.id) pc_user_btn_group.push($(`<button class="pc-user-edit" type="submit" role="button">Edit Profile</button>`).on('click', () => {
                        $('.pc-user-btn-group button').append(``)
                    }));
                    else {
                        if (user_data.is_my_friend) pc_user_btn_group.push($(`<button class="pc-user-remove-friend" type="submit" role="button">Remove Friend</button>`).on('click', (e) => remove_friend(e, user_data)));
                        else if (user_data.is_friend_requested) pc_user_btn_group.push($(`<button class="pc-user-friend-request" type="submit" role="button">Cancel Request</button>`).on('click', (e) => cancel_friend_request(e, user_data)));
                        else if (user_data.is_friend_pending) {
                            pc_user_btn_group.push($(`<button class="pc-user-friend-accept" type="submit" role="button">Accept Friend</button>`).on('click', (e) => accept_friend_request(e, user_data)));
                            pc_user_btn_group.push($(`<button class="pc-user-friend-request" type="submit" role="button">Reject</button>`).on('click', (e) => cancel_friend_request(e, user_data)));
                        } else pc_user_btn_group.push($(`<button class="pc-user-add-friend" type="submit" role="button">Add Friend</button>`).click((e) => add_friend(e, user_data)));
                        pc_user_btn_group.push($(`<button class="pc-user-message" type="submit" role="button">Message</button>`).on('click', (e) => {
                            let that = $(e.target);
                            that.prop('disabled', true).text('Messaging').css('opacity', '0.5');
                            socket.emit('create-or-join-room', user_data.id, id => {
                                if (id) $.fn.navigate_to(`/spa/messages/${id}`);
                                else that.prop('disabled', false).text('Message').css('opacity', '1');
                            });
                        }));
                    }
                    $('.pc-user-btn-group').html(pc_user_btn_group);
                    let profile_data_obj = {
                        "myself": {
                            header: 'About MySelf',
                            raw: ''
                        },
                        "bio": {
                            header: 'Biological Information',
                            raw: '',
                        },
                        "contact": {
                            header: 'Contact Information',
                            raw: ''
                        }
                    };
                    for (let key in user_data.profile_data) {
                        let value = user_data.profile_data[key];
                        if (value.value && value.value.length && profile_data_obj[value.category]) 
                            profile_data_obj[value.category].raw += value.category == 'myself' ? value.value :
                            `
                                <tr>
                                    <th>${key}</th>
                                    <td>${Array.isArray(value.value) ? value.value.join(', ') : value.value}</td>
                                </tr>
                            `
                    }
                    let profile_data_raw = '';
                    for (let key in profile_data_obj) {
                        let value = profile_data_obj[key];
                        if (value.raw) profile_data_raw += `
                            <div class="pc-user-info-${key}">
                                <div class="pc-user-info-header">${value.header}</div>
                                <div class="pc-user-info-content">
                                    <table>
                                        ${value.raw}
                                    </table>
                                </div>
                            </div>
                        `;
                    }
                    $('.pc-user-info-body').html(profile_data_raw || '<div style="padding: 10px;">Nothing to show</div>');
                    $('.profile-content').show();
                    nanobar.go(100);
                },
                error: function(xhr, textStatus, errorThrown) {
                    if (xhr.status == 404) $('.profile-content').html(xhr.responseText).show();
                    _ajax0 = false;
                    nanobar.go(100);
                    console.log(errorThrown)
                },
            });
        }
    }

    async before_render() {
        $('.navbar').hide();
    }

    async render() {
        return `
            <div class="profile">
                <div class="profile-header header-back">
                    <div class="header-back-icon" onclick="$.fn.go_back('/spa');">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text"></p>
                </div>
                <div class="profile-content" style="display: none;">
                    <div class="pc-main">
                        <div class="pc-user-cover">
                            <div class="pc-user">
                                <div class="pc-user-img">
                                    <img src="/dist/img/default-profile.png" alt="not found"> 
                                    <i class='bx bx-edit'></i>
                                </div>
                                <div class="pc-user-name">
                                    <div>User</div>
                                    <span>@user</span>
                                </div>
                            </div>
                        </div>
                        <div class="pc-user-actions">
                            <div class="pc-user-btn-group"></div>
                        </div>
                        <div class="pc-user-info-body">
                        </div>
                    </div>
                </div>
            </div>
            
        `;
    }

    async after_render() {
    }
    async before_new_render() {
        $('.navbar').show();
    }
}

function add_friend(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Adding Friend').css('opacity', '0.5');
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

function cancel_friend_request(e) {
    let that = $(e.target), reject = that.text() == 'Reject';
    that.prop('disabled', true).text(reject ? 'Rejecting' : 'Cancelling').css('opacity', '0.5');
    $('.pc-user-friend-accept').prop('disabled', true).css('opacity', '0.5');
    $('.pc-user-friend-request').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/cancel`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Add Friend').css('opacity', '1').attr('class', 'pc-user-add-friend');
            $('.pc-user-friend-accept').remove();
            $('.pc-user-friend-request').remove();
            that.off('click');
            that.on('click', (e) => add_friend(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text(reject ? 'Reject' : 'Cancel Request').css('opacity', '1');
        },
    });
}

function accept_friend_request(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Accepting').css('opacity', '0.5');
    $('.pc-user-friend-accept').prop('disabled', true).css('opacity', '0.5');
    $('.pc-user-friend-request').prop('disabled', true).css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/accept`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Remove Friend').css('opacity', '1').attr('class', 'pc-user-remove-friend');
            $('.pc-user-friend-accept').remove();
            $('.pc-user-friend-request').remove();
            that.off('click');
            that.on('click', (e) => remove_friend(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Accept Friend').css('opacity', '1');
        },
    });
}

function remove_friend(e, user_data) {
    $.confirm({
        title: 'Remove Friend',
        content: `Are you sure you want to remove <b>${user_data.name}</b> from your friend list?`,
        backgroundDismiss: true,
        buttons: {
            confirm: () => {
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
                        that.prop('disabled', false).text('Add Friend').css('opacity', '1').attr('class', 'pc-user-add-friend');
                        that.off('click');
                        that.on('click', (e) => add_friend(e, user_data));
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        that.prop('disabled', false).text('Remove Friend').css('opacity', '1');
                    },
                });
            },
            cancel: () => {}
        }
    })
}
