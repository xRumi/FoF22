$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    const email = $("#email").val();
    $.ajax({
        type: 'POST',
        url: `/forgot-password/post`,
        data: {
            email
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-section').html(`<div class="alert alert-success" role="alert">
                <p>We have send an email with instructions to change the password. Make sure to check the both index and spam folder.</p>
                <hr>
                <p class="mb-0">The email address must be associated with a registered user</p>
            </div>`);
            $('#sub-btn').html('Done');
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
            $('#sub-btn').html('Reset').prop("disabled", false);
        },
    });
});