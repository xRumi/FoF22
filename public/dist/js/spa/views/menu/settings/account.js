import Constructor from "../../constructor.js";

var data = {};

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Account Settings");
        $.fn.nav__back(true, 'Account Settings', '/spa/menu/settings');
        $.fn.cleanup = () => {
            $('#app').off('submit.account-settings');
        }
        $('#app').on('submit.account-settings', '#form1', (e) => {
            e.preventDefault();
            if (!($("#username").val() || $('#full_name').val() || $('#email').val())) return false;
            $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
            $.ajax({
                type: 'POST',
                url: `/account/update/password`,
                data: {
                    username: $('#username').val(),
                    name: $('#full_name').val(),
                    email: $('#email').val(),
                    password: $('#password').val()
                },
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    $('.alert-section').html(`<div class="alert alert-success" role="alert">${result}</div>`);
                    $('#sub-btn').html('update').prop("disabled", false);
                    $('#password').val('');
                },
                error: function(xhr, textStatus, errorThrown) {
                    $('#password').val('');
                    $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
                    $('#sub-btn').html('update').prop("disabled", false);
                },
            });
        });
        $.ajax({
            type: 'GET',
            url: `/account/info`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                data = result;
                $('#sub-btn').html('update').prop("disabled", false);
                $('#username').attr('placeholder', result.username);
                $('#full_name').attr('placeholder', result.name);
                $('#email').attr('placeholder', result.email);
            },
            error: function(xhr, textStatus, errorThrown) {
                $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
                $('#sub-btn').html('update').prop("disabled", false);
            },
        });
    }

    async getHtml() {
        return `
            <div class="row p-3">
                <div class="col-sm-6 mb-4">
                    <div class="card">
                        <h5 class="card-header">Personal Informations</h5>
                        <div class="card-body">
                            <form id="form1" class="was-validated" novalidate="" autocomplete="off">
                                <div class="mb-3">
                                    <label class="mb-2 text-muted" for="username">Username</label>
                                    <input id="username" type="text" class="form-control shadow-none" style="background-image: unset;" name="username" value="" minlength="4" maxlength="16"${data.username ? ` placeholder="${data.username}"` : ''}>
                                    <div id="i_0" class="invalid-feedback"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="mb-2 text-muted" for="full_name">Full Name</label>
                                    <input id="full_name" type="text" class="form-control shadow-none" style="background-image: unset;" name="full_name" value="" minlength="4" maxlength="16"${data.name ? ` place holder="${data.name}"` : ''}>
                                    <div id="i_1" class="invalid-feedback"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="mb-2 text-muted" for="email">Email Address</label>
                                    <input id="email" type="email" class="form-control shadow-none" style="background-image: unset;" name="email"${data.email ? ` placeholder="${data.email}"` :''}>
                                    <div id="i_2" class="invalid-feedback"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="mb-2 text-muted" for="password">Password</label>
                                    <input id="password" type="password" class="form-control shadow-none" name="password" value="" minlength="8" maxlength="32" required>
                                    <div id="i_3" class="invalid-feedback"></div>
                                </div>
                                <div class="alert-section"></div>
                                <div class="d-flex align-items-center">
                                    <button type="submit" id="sub-btn" class="btn btn-primary ms-auto shadow-none" disabled><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}
