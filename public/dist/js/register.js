$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Proceeding');
    const username = $("#username").val(),
        email = $("#email").val(),
        name = $("#name").val();
    $.ajax({
        type: 'POST',
        url: `/register/post`,
        data: {
            username,
            email,
            name
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-section').html(`<div class="alert alert-success" role="alert">
                <p>${result || `We have sent an confirmation email to <b>${email}</b>. Make sure to check the both index and spam folder.`}</p>
            </div>`);
            $('#sub-btn').html('Proceed').prop("disabled", false);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
            $('#sub-btn').html('Proceed').prop("disabled", false);
        },
    });
});