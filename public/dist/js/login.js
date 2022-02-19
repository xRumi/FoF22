const ref = new URLSearchParams(window.location.search).get('ref');
window.history.pushState({}, '', window.location.origin + window.location.pathname);
$.fn.isValid = function() {
    return this[0].checkValidity();
}
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> logging...');
    const username = $("#username").val(), password = $("#password").val();
    $.ajax({
        type: 'POST',
        url: `/auth/local${ref ? `?ref=${ref}` : ''}`,
        data: {
            username,
            password,
            remember: $('#remember').is(":checked") ? 'true' : 'false',
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('#sub-btn').html('logged in').addClass('btn-success').css('opacity', '1');
		    window.location.replace(result.returnTo || `/${ref}` || "/");
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#password').val('');
            if (xhr.status == 400) {
                $('.alert-space').html(`<div class="alert alert-primary d-flex align-items-center" role="alert">
                    <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Info:"><use xlink:href="#info-fill"/></svg>
                    <div>${xhr.responseText}</div>
                </div>`);
            } else $('.invalid-feedback').text(xhr.responseText || 'no response');
            $('#sub-btn').html('Login');
            $('#sub-btn').prop("disabled", false);
        },
    });
});