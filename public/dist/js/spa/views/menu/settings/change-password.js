import Constructor from "../../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Change Password");
        $.fn.cleanup = () => {
            $.fn.change_password = null;
            $('#app').off('keyup.change-password');
        }
        $('#app').on('keyup.change-password', '#password, #password-confirm', function () {
            if ($("#password").val() && $("#password").val().length >= 8) $('#password').removeClass('is-invalid').addClass('is-valid');
            else $('#password').removeClass('is-valid').addClass('is-invalid');
            if ($('#password').val() == $('#password-confirm').val()) $('#password-confirm').removeClass('is-invalid').addClass('is-valid');
            else $('#password-confirm').removeClass('is-valid').addClass('is-invalid');
        });
        $.fn.change_password = (e) => {
            e.preventDefault();
            if ($('#current_password').val() && $('#current_password').val().length >= 8 && $('#password').val() && $('#password').val().length >= 8 && $('#password').val() == $('#password-confirm').val()) {
               $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
                const new_pass = $("#password").val(),
                    old_pass = $('#current_password').val();
                $.ajax({
                    type: 'POST',
                    url: `/account/update/password`,
                    data: {
                        old_pass,
                        new_pass,
                    },
                    timeout: 30000,
                    success: function(result, textStatus, xhr) {
                        $('.alert-section').html(`<div class="alert alert-success" role="alert">${result}</div>`);
                        $('#sub-btn').html('update').prop("disabled", false);
                        $('#current_password').val('');
                        $('#password').val('');
                        $('#password-confirm').val('');
                        setTimeout(() => window.location.replace('/login'), 2000);
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        $('#current_password').val('');
                        $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
                        $('#sub-btn').html('update').prop("disabled", false);
                    },
                });
            } else return false;
        }
    }

    async getHtml() {
        return `
            <div class="col-sm-6 mb-4 p-3">
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
            </div>`;
    }
}
