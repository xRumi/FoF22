var password = document.getElementById("new_pass"),
    confirm_password = document.getElementById("c_new_pass");

function validate_password() {
    if (password.value != confirm_password.value) confirm_password.setCustomValidity("passwords don't match");
    else confirm_password.setCustomValidity('');
}

password.onchange = validate_password;
confirm_password.onkeyup = validate_password;

$('.info').submit(function(e) {
    e.preventDefault();
    $(".cover").fadeIn(100);
    $('.button_info').addClass('button_loading');
    const name = $("#name").val(), email = $("#email").val(), password = $("#c_pass_info").val();
    $.ajax({
        type: 'POST',
        url: '/account/update/info',
        data: {
            name,
            email,
            password
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            if (result.messages && result.messages.length) {
                result.messages.forEach(x => {
                    iziToast[x.status]({
                        title: x.status || 'Unknown',
                        message: x.message || 'no response',
                    });
                });
            } else {
                iziToast.error({
                    title: 'Error',
                    message: 'no response'
                })
            }
            $('.button_text_info').text('update');
            $('#name').attr('placeholder', result.data.name);
            $('#email').attr('placeholder', result.data.email);
            $('.info')[0].reset();
            $('.button_info').removeClass('button_loading');
            $(".cover").fadeOut(100);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#c_pass_info').val('');
            $('.button_info').removeClass('button_loading');
            $('.button_text_info').text(xhr.responseText || 'no response');
 		    $(".cover").fadeOut(100);
        },
        fail: function(xhr, textStatus, errorThrown) {
            $('#c_pass_info').val('');
	        $('.button_info').removeClass('button_loading');
            $('.button_text_info').text(xhr.responseText || 'Request failed');
            $(".cover").fadeOut(100);
        }
    });
});

$('.password').submit(function(e) {
    e.preventDefault();
    $(".cover").fadeIn(100);
    $('.button_pass').addClass('button_loading');
    const new_pass = $("#new_pass").val(), old_pass = $("#c_old_pass").val();
    $.ajax({
        type: 'POST',
        url: '/account/update/password',
        data: {
            new_pass,
            old_pass
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            if (result.messages && result.messages.length) {
                result.messages.forEach(x => {
                    iziToast[x.status]({
                        title: x.status || 'Unknown',
                        message: x.message || 'no response',
                    });
                });
            } else {
                iziToast.error({
                    title: 'Error',
                    message: 'no response'
                });
            }
            $('.button_text_pass').text('update');
            $('.password')[0].reset();
            $('.button_pass').removeClass('button_loading');
            $(".cover").fadeOut(100);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#c_old_pass').val('');
            $('.button_pass').removeClass('button_loading');
            $('.button_text_pass').text(xhr.responseText || 'no response');
 		    $(".cover").fadeOut(100);
        },
        fail: function(xhr, textStatus, errorThrown) {
            $('#c_old_pass').val('');
	        $('.button_pass').removeClass('button_loading');
            $('.button_text_pass').text(xhr.responseText || 'Request failed');
            $(".cover").fadeOut(100);
        }
    });
});

$('.danger').submit(function(e) {
    e.preventDefault();
});

function deactive() {
    const password = $("#c_pass_danger").val();
    if (!password) return;
    $(".cover").fadeIn(100);
    $('.button_deactive').addClass('button_loading');
    $.ajax({
        type: 'POST',
        url: '/account/deactive',
        data: {
            password
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.button_text_deactive').text('deactive');
            $('.button_deactive').removeClass('button_loading');
            $(".cover").fadeOut(100);
            iziToast.success({
                title: 'Ok',
                message: result || 'no response'
            });
            setTimeout(() => { window.location.replace('/') }, 5000);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#c_pass_danger').val('');
            $('.button_deactive').removeClass('button_loading');
            $('.button_text_deactive').text(xhr.responseText || 'no response');
 		    $(".cover").fadeOut(100);
        },
        fail: function(xhr, textStatus, errorThrown) {
            $('#c_pass_danger').val('');
            $('.button_deactive').removeClass('button_loading');
            $('.button_text_deactive').text(xhr.responseText || 'no response');
 		   $(".cover").fadeOut(100);
        }
    });
}

function $delete() {
    const password = $("#c_pass_danger").val();
    if (!password) return;
    $(".cover").fadeIn(100);
    $('.button_delete').addClass('button_loading');
    $.ajax({
        type: 'POST',
        url: '/account/delete',
        data: {
            password
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.button_text_delete').text('delete');
            $('.button_delete').removeClass('button_loading');
            $(".cover").fadeOut(100);
            iziToast.success({
                title: 'Ok',
                message: result || 'no response'
            });
            setTimeout(() => { window.location.replace('/') }, 5000);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('#c_pass_danger').val('');
            $('.button_delete').removeClass('button_loading');
            $('.button_text_delete').text(xhr.responseText || 'no response');
 		   $(".cover").fadeOut(100);
        },
        fail: function(xhr, textStatus, errorThrown) {
            $('#c_pass_danger').val('');
            $('.button_delete').removeClass('button_loading');
            $('.button_text_delete').text(xhr.responseText || 'no response');
 		   $(".cover").fadeOut(100);
        }
    });
}