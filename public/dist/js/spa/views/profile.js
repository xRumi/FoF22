import Constructor from "./constructor.js";

let _ajax0 = false, user_data;

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
                    if (user_data.has_cover) $('.pc-cover img').attr('src', `/dist/img/users/${user_data.id}/cover.png`);
                    $('.pc-user img').attr('src', `/dist/img/users/${user_data.id}/profile.png`);
                    $('.pc-user-content div').text(user_data.name);
                    $('.pc-user-content span').text(`@${user_data.username}`);
                    if (user_data.id == client.id) $('.pc-user-btn-group').html(`<button class="pc-user-edit" type="submit" role="button">Edit</button>`);
                    else $('.pc-user-btn-group').html(`${user_data.is_my_friend ? `<button class="pc-user-remove-friend" type="submit" role="button">Remove Friend</button>` : `<button class="pc-user-add-friend" type="submit" role="button">Add Friend</button>`}
                        <button class="pc-user-message" type="submit" role="button">Send Message</button>
                    `);
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

    async render() {
        return `
            <div class="profile">
                <div class="profile-header header-back" style="display: none;">
                    <div class="header-back-icon">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">FoF22 User Profile</p>
                </div>
                <div class="lds-dual-ring"></div>
                <div class="profile-content" style="display: none;">
                    <div class="pc-item pc-cover">
                        <img src="/dist/img/no-cover-image.svg" alt="" srcset="">
                    </div>
                    <div class="pc-item pc-user">
                        <div class="pc-user-img">
                            <img src="/dist/img/users/61d001de9b64b8c435985da5/profile.png" alt="" srcset="">
                        </div>
                        <div class="pc-user-content"><div>FoF22 User</div><span>@user</span></div>
                        <div class="pc-user-btn-group">
                        </div>
                    </div>
                    <div class="pc-item pc-bio"></div>
                    <div class="pc-item pc-about"></div>
                    <div class="pc-item pc-other"></div>
                </div>
            </div>
        `;
    }

    async after_render() {
    }
}
