const back_to = new URLSearchParams(window.location.search).get('back_to');
$.fn.isValid = function() { return this[0].checkValidity(); }
$('.form').submit(function(e) {
    e.preventDefault();
    if (!$('.form').isValid()) return false;
    $('#sub-btn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
    const username = $("#username").val(), password = $("#password").val();
    $.ajax({
        type: 'POST',
        url: `/auth/local${back_to ? `?back_to=${back_to}` : ''}`,
        data: {
            username,
            password,
            remember: $('#remember').is(":checked") ? 'true' : 'false',
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('#sub-btn').html('done').addClass('btn-success').css('opacity', '1');
		    window.location.replace(back_to || "/");
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#password').val('');
            if (xhr.status == 400) $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
            else $('.invalid-feedback').text(xhr.responseText || 'no response');
            $('#sub-btn').html('Login').prop("disabled", false);
        },
    });
});
