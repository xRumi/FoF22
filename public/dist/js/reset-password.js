$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> sending...');
    const password = $("#password").val();
    $.ajax({
        type: 'POST',
        url: `/reset-password`,
        data: {
            password,
            logout: $('#logout').is(":checked") ? 'true' : 'false',
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-space').html(`<div class="alert alert-primary d-flex align-items-center" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                <div>If the provided email address is correct, we will send an email with instructions to change your password. Please check both your <b>index and spam</b> folder.</div>
            </div>`);
            $('#sub-btn').html('done').addClass('btn-success').css('opacity', '1').prop("disabled", false);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-space').html(`<div class="alert alert-danger d-flex align-items-center" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:"><use xlink:href="#exclamation-triangle-fill"/></svg>
                <div>Error! try again latter</div>
            </div>`)
            $('#sub-btn').html('done').addClass('btn-success').css('opacity', '1').prop("disabled", false);
        },
    });
});