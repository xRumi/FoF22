import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Change Password");
    }

    async before_render() {
        $('.navbar').hide();
    }

    async render() {
        return $(`
            <div class="account-change-password">
                <div class="header-back">
                    <div class="header-back-icon" onclick="$.fn.go_back('/spa/menu');">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">Change Account Password</p>
                </div>
                <div class="account-change-password-form">
                    <form id="change-password-form" style="padding: 10px;">
                        <label for="confirm-password-input">Confirm Password</label>
                        <input id="confirm-password-input" type="password" minlength="8" maxlength="32" required>
                        <label for="new-password-input">New Password</label>
                        <input id="new-password-input" type="password" minlength="8" maxlength="32" required>
                        <label for="confirm-new-password-input">Confirm New Password</label>
                        <input id="confirm-new-password-input" type="password" minlength="8" maxlength="32" required>
                        <input type="submit" hidden />
                    </form>
                    <div id="new-password-response" style="color: white; border-top: solid 1px; background-color: darkorange; padding: 5px; padding-left: 10px; display: none"></div>
                </div>
            </div>`).on('submit', '#change-password-form', (e) => {
                e.preventDefault();
                let new_password = $('#new-password-input');
                let old_password = $('#confirm-password-input');
                let confirm_new_password = $('#confirm-new-password-input');
                if (!(old_password.val() && new_password.val())) return false;
                if (new_password.val() !== confirm_new_password.val()) return $('#new-password-response').text('Confirm password did not match').show();
                $('#change-password-form input').prop('disabled', true);
                $.ajax({
                    type: 'POST',
                    url: `/me/password/edit`,
                    data: {
                        old_pass: old_password.val(),
                        new_pass: new_password.val(),
                    },
                    timeout: 30000,
                    success: function(result, textStatus, xhr) {
                        $('#new-password-response').text(result || 'success').css('background-color', 'lightseagreen').show();
                        window.location.replace('/login?back_to=/spa/menu/account/change-password');
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        if (xhr.status == 406) {
                            new_password.val('');
                            confirm_new_password.val('');
                        } else if (xhr.status == 400) old_password.val('');
                        $('#change-password-form input').prop('disabled', false);
                        if (xhr.responseText == 'force_logout') window.location.replace('/login?back_to=/spa/menu/account/change-password');
                        else $('#new-password-response').text(xhr.responseText || 'no response').css('background-color', 'darkorange').show();
                    },
                });
            });
    }
}
