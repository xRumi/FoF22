const token = new URLSearchParams(window.location.search).get('token');
$('#sub-btn').click(function() {
    if (!is_valid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating');
    const password = $("#password").val(),
        username = $("#username").val(),
        name = $("#name").val();
    $.ajax({
        type: 'POST',
        url: `/register/confirm/post`,
        data: {
            token,
            password,
            username,
            name
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-section').html(`<div class="alert alert-success" role="alert">${result}</div>`);
            $('#sub-btn').html('Create').prop("disabled", true);
            setTimeout(() => { window.location.replace('/login'); }, 5000);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
            $('#sub-btn').html('Create').prop("disabled", false);
        },
    });
});

$('#password, #password-confirm').on('keyup', function () {
    if ($("#password").val() && $("#password").val().length >= 8) $('#password').removeClass('is-invalid').addClass('is-valid');
    else $('#password').removeClass('is-valid').addClass('is-invalid');
    if ($('#password').val() == $('#password-confirm').val()) $('#password-confirm').removeClass('is-invalid').addClass('is-valid');
    else $('#password-confirm').removeClass('is-valid').addClass('is-invalid');
});

function is_valid() {
    if ($('#password').val() && $('#password').val().length >= 8 && $('#password').val() == $('#password-confirm').val() && $("#username").val() && $("#name").val()) return true;
    else return false;
}