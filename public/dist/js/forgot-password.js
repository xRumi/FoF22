$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Proceeding');
    const email = $("#email").val();
    $.ajax({
        type: 'POST',
        url: `/reset-password/email`,
        data: {
            email
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-section').html(`<div class="alert alert-success" role="alert">
                <p>If there is any user associated with this address, we will send an email with instructions to change the password. Please make sure to check the both index and spam folder.</p>
                <hr>
                <p class="mb-0">The link will expire in about <span class="text-danger">24 hours</span></p>
            </div>`);
            $('#sub-btn').html('Proceed').prop("disabled", false);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-section').html(`<div class="alert alert-danger" role="alert">Something went wrong! Try again later.</div>`);
            $('#sub-btn').html('Proceed').prop("disabled", false);
        },
    });
});