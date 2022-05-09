import Constructor from "../constructor.js";

let temp_pass = null, pass_timeout;

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Change Password");
    }

    async before_render() {
        $('.navbar').hide();
    }

    async render() {
        return $(`
            <div class="header-back">
                <div class="header-back-icon" onclick="$.fn.go_back('/spa/menu');">
                    <i class='bx bx-chevron-left'></i>
                </div>
                <p class="header-back-text">Change Account Password</p>
            </div>
            <div class="account-change-password">
                <div class="confirm-password">
                    <div class="account-change-password-header">Confirm Current Password</div>
                    <form id="confirm-password-form" style="padding: 10px;">
                        <input style="width: 100%; outline: 0;" id="confirm-password-input" type="password" minlength="8" maxlength="32" required autofocus>
                        <input type="submit" hidden />
                    </form>
                    <div id="confirm-password-response" style="color: white; border-top: solid 1px; background-color: darkorange; padding: 5px; padding-left: 10px; display: none"></div>
                </div>
                <div class="change-password" style="display: none;">
                    <div class="account-change-password-header">Change Your Password</div>
                    <form id="change-password-form" style="padding: 10px;">
                        <label for="new-password-input">New Password</label>
                        <input style="display: block; width: 400px; outline: 0;" id="new-password-input" type="password" minlength="8" maxlength="32" required>
                        <label for="confirm-new-password-input">Confirm New Password</label>
                        <input style="display: block; width: 400px; outline: 0;" id="confirm-new-password-input" type="password" minlength="8" maxlength="32" required>
                        <input type="submit" hidden />
                    </form>
                    <div id="new-password-response" style="color: white; border-top: solid 1px; background-color: darkorange; padding: 5px; padding-left: 10px; display: none"></div>
                </div>
            </div>
            <div class="col-sm-6 mb-4 p-3" style="display: none;">
                <div class="card">
                    <div class="card-body">
                        <form class="was-validated" novalidate="" autocomplete="off">
                            <div class="mb-3">
                                <label class="mb-2 text-muted" for="current_password">Current Password</label>
                                <input id="current_password" type="password" class="form-control shadow-none" name="current_password" value="" minlength="8" maxlength="32" required autofocus>
                            </div>
                        </form>
        
                        <div class="mb-3">
                            <label class="mb-2 text-muted" for="password">New Password</label>
                            <input id="password" type="password" class="form-control shadow-none" name="password" value="" minlength="8" maxlength="32" required>
                            <div class="invalid-feedback">The length must be above <b>8</b></div>
                        </div>
        
                        <div class="mb-3">
                            <label class="mb-2 text-muted" for="password-confirm">Confirm New Password</label>
                            <input id="password-confirm" type="password" class="form-control shadow-none" name="password_confirm" minlength="8" maxlength="32" required>
                            <div class="invalid-feedback">Please confirm your new password</div>
                        </div>
        
                        <div class="alert-section"></div>
        
                        <div class="d-flex align-items-center">
                            <button type="submit" id="sub-btn" class="btn btn-primary ms-auto shadow-none" onclick="$.fn.change_password(event);">update</button>
                        </div>
                    </div>
                </div>
            </div>`).on('submit', '#confirm-password-form', (e) => {
                e.preventDefault();
                let password = $('#confirm-password-input').val();
                if (!password) return false;
                $.ajax({
                    type: 'POST',
                    url: `/me/password/verify`,
                    data: {
                        password
                    },
                    timeout: 30000,
                    success: function(result, textStatus, xhr) {
                        $('.confirm-password').hide();
                        $('.change-password').show();
                        $('#confirm-password-input').val('');
                        temp_pass = password;
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        $('#confirm-password-input').val('');
                        if (xhr.responseText == 'force_logout') window.location.replace('/login?ref=/spa/menu/account/change-password');
                        else $('#confirm-password-response').text(xhr.responseText || 'no response').css('background-color', 'darkorange').show();
                    },
                });
            }).on('submit', '#change-password-form', (e) => {
                e.preventDefault();
                console.log('hey');
                let new_password = $('#new-password-input');
                if (!(temp_pass && new_password.val() && new_password.val().length >= 8 && new_password.val() == $('#confirm-new-password-input').val())) {
                    $('#new-password-response').text('Confirm password did not match').show();
                    return false;
                }
                $.ajax({
                    type: 'POST',
                    url: `/me/password/edit`,
                    data: {
                        old_pass: temp_pass,
                        new_pass: new_password.val(),
                    },
                    timeout: 30000,
                    success: function(result, textStatus, xhr) {
                        $('.change-password').hide();
                        $('.confirm-password').show();
                        temp_pass = null;
                        $('#confirm-password-response').text(result || 'success').css('background-color', 'lightseagreen').show();
                        setTimeout(() => { window.location.replace('/login?ref=/spa/menu/account/change-password'); }, 3000);
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        $('#new-password-response').text(xhr.responseText || 'no response').show()
                    },
                });
            });
    }
}