const ref = new URLSearchParams(window.location.search).get('ref');
window.history.pushState({}, '', window.location.origin + window.location.pathname);

$('form').submit(function(e) {
    e.preventDefault();
    $(".cover").fadeIn(100);
    $('.button').addClass('button_loading');
    const username = $("#username").val(), password = $("#password").val();
    $.ajax({
        type: 'POST',
        url: `/auth/local${ref ? `?ref=${ref}` : ''}`,
        data: {
            username,
            password
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.button').removeClass('button_loading');
            $('.button_text').text(result.message || 'no response');
		    window.location.replace(result.returnTo || `/${ref}` || "/");
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#password').val('');
            $('.button').removeClass('button_loading');
            $('.button_text').text(xhr.responseText || 'no response');
 		    $(".cover").fadeOut(100);
        },
        fail: function(xhr, textStatus, errorThrown) {
            $('#password').val('');
	        $('.button').removeClass('button_loading');
            $('.button_text').text(xhr.responseText || 'Request failed');
            $(".cover").fadeOut(100);
        }
    });
});
