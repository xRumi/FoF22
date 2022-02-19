$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> sending...');
    const email = $("#email").val();
    $.ajax({
        type: 'POST',
        url: `/reset-password/email`,
        data: {
            email
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-space').html(`<div class="alert alert-success" role="alert">
                <p>If there is any user associated with this address, we will send an email with instructions to change password. Please make sure check both index and spam folder.</p>
                <hr>
                <p class="mb-0">The link will expire in <b class="text-danger">24 hours</b></p>
            </div>`);
            $('#sub-btn').html('send link').prop("disabled", false);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-space').html(`<div class="alert alert-danger" role="alert">Something went wrong! Try again later.</div>`);
            $('#sub-btn').html('send link').prop("disabled", false);
        },
    });
});