import Constructor from "./constructor.js";

let _ajax0 = false, user_data;

function add_friend(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Sending friend Request').css('opacity', '0.5');
    $.ajax({
        type: 'POST',
        url: `/friends/add`,
        data: {
            user: user_data.id
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            that.prop('disabled', false).text('Cancel Friend Request').css('opacity', '1').attr('class', 'pc-user-friend-request');
            that.off('click');
            that.on('click', (e) => cancel_friend_request(e, user_data));
        },
        error: function(xhr, textStatus, errorThrown) {
            that.prop('disabled', false).text('Add Friend').css('opacity', '1');
        },
    });
}

function cancel_friend_request(e) {
    let that = $(e.target);
    that.prop('disabled', true).text('Cancelling Friend Request').css('opacity', '0.5');
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
            that.prop('disabled', false).text('Cancel Friend Request').css('opacity', '1');
        },
    });
}

function accept_friend_request(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Accepting Friend Request').css('opacity', '0.5');
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
            that.prop('disabled', false).text('Accept Friend Request').css('opacity', '1');
        },
    });
}

function remove_friend(e, user_data) {
    let that = $(e.target);
    that.prop('disabled', true).text('Removing Friend').css('opacity', '0.5');
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
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle("Profile");
        navbar('#nav__link__profile', true);
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
                    $('.profile-header p').text(user_data.name);
                    if (user_data.has_cover) $('.pc-user-cover').css('background-image', `/dist/img/users/${user_data.id}/cover.png`);
                    if (user_data.has_profile_picture) $('.pc-user-img img').attr('src', `/dist/img/users/${user_data.id}/profile.png`);
                    $('.pc-user-name div').text(user_data.name);
                    $('.pc-user-name span').text(`@${user_data.username}`);
                    let pc_user_btn_group = [];
                    if (user_data.id == client.id) pc_user_btn_group.push($(`<button class="pc-user-edit" type="submit" role="button">Edit Profile</button>`).on('click', () => {
                        console.log('edit profile');
                    }));
                    else {
                        if (user_data.is_my_friend) pc_user_btn_group.push($(`<button class="pc-user-remove-friend" type="submit" role="button">Remove Friend</button>`).on('click', (e) => remove_friend(e, user_data)));
                        else if (user_data.is_friend_requested) pc_user_btn_group.push($(`<button class="pc-user-friend-request" type="submit" role="button">Cancel Friend Request</button>`).on('click', (e) => cancel_friend_request(e, user_data)));
                        else if (user_data.is_friend_await_accept) {
                            pc_user_btn_group.push($(`<button class="pc-user-friend-accept" type="submit" role="button">Accept Friend Request</button>`).on('click', (e) => accept_friend_request(e, user_data)));
                            pc_user_btn_group.push($(`<button class="pc-user-friend-request" type="submit" role="button">Cancel Friend Request</button>`).on('click', (e) => cancel_friend_request(e, user_data)));
                        } else pc_user_btn_group.push($(`<button class="pc-user-add-friend" type="submit" role="button">Add Friend</button>`).click((e) => add_friend(e, user_data)));
                        pc_user_btn_group.push($(`<button class="pc-user-message" type="submit" role="button">Message</button>`).on('click', (e) => {
                            let that = $(e.target);
                            that.prop('disabled', true).text('Messaging').css('opacity', '0.5');
                            socket.emit('create-or-join-room', user_data.id, id => {
                                if (id) $.fn.navigateTo(`/spa/messages/${id}`);
                                else that.prop('disabled', false).text('Message').css('opacity', '1');
                            });
                        }));
                    }
                    $('.pc-user-btn-group').html(pc_user_btn_group);
                    let pc_user_info_bio = '', user_info_bio = user_data.user_info.about.bio;
                    for (let key in user_info_bio) {
                        if (user_info_bio[key]) {
                            pc_user_info_bio += `
                                <div>
                                    <div>${key}:</div>
                                    <span>${user_info_bio[key]}</span>
                                </div>
                            `
                        }
                    }
                    let pc_user_info_myself = user_data.user_info.about["About Myself"] || "";
                    let pc_user_about = '';
                    if (pc_user_info_bio) pc_user_about += `
                        <div class="pc-user-info-bio">
                            <div class="pc-user-info-header">Biological Information</div>
                            <div class="pc-user-info-content">
                                ${pc_user_info_bio}
                            </div>
                        </div>
                    `;
                    if (pc_user_info_myself) pc_user_about += `
                        <div class="pc-user-info-myself">
                            <div class="pc-user-info-header">About Myself</div>
                            <div class="pc-user-info-content">
                                ${pc_user_info_myself}
                            </div>
                        </div>
                    `;
                    $('.pc-user-info-body').html(pc_user_about || 'Nothing to show');
                    $('.profile .lds-dual-ring').hide();
                    $('.profile-content').show();
                    nanobar.go(100);
                },
                error: function(xhr, textStatus, errorThrown) {
                    if (xhr.status == 404) {
                        $('.profile').html(xhr.responseText);
                        $('.profile .lds-dual-ring').hide();
                    }
                    _ajax0 = false;
                    nanobar.go(100);
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
                    <div class="header-back-icon" onclick="history.back();">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">FoF22 User</p>
                </div>
                <div class="lds-dual-ring"></div>
                <div class="profile-content" style="display: none;">
                    <div class="pc-main">
                        <div class="pc-user-cover">
                            <div class="pc-user">
                                <div class="pc-user-img">
                                    <img src="/dist/img/default-profile.png" alt="not found">
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
        let pc_user_info_header = $(".pc-user-info-header");
        let pc_user_info_headers = $(".pc-user-info-header div");
        for (let i = 0; i < pc_user_info_headers.length; i++) {
            pc_user_info_headers[i].addEventListener("click", () => {
                pc_user_info_header[0].querySelector(".pc-user-info-header-active").classList.remove("pc-user-info-header-active");
                pc_user_info_headers[i].classList.add("pc-user-info-header-active");
            });
        }
    }
    async before_new_render() {
        $('.navbar').show();
    }
}