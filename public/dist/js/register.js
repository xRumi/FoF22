console.log('h')

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
        url: `/register/post`,
        data: {
            email,
        },
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            $('.alert-section').html(`<div class="alert alert-success" role="alert">
                <p>${result.message}</p>
            </div>`);
            if (result.time_left) start_timer(result.time_left + 5);
        },
        error: function(xhr, textStatus, errorThrown) {
            $('.alert-section').html(`<div class="alert alert-danger" role="alert">${xhr.responseJSON ? `Try again in ${xhr.responseJSON.time_left + 5} seconds` : xhr.responseText || 'Something went wrong! Try again later.'}</div>`);
            if (xhr.responseJSON) start_timer(xhr.responseJSON.time_left + 5);
            else $('#sub-btn').html('Resend').prop("disabled", false);
        },
    });
});

let timer = undefined, time_left;

function start_timer(time) {
    time_left = time;
    if (timer) clearInterval(timer);
    $('#sub-btn').text(`Resend(${time_left})`).prop("disabled", true);
    timer = setInterval(() => {
        time_left--;
        if (time_left) $('#sub-btn').text(`Resend(${time_left})`).prop("disabled", true);
        else {
            clearInterval(timer);
            $('#sub-btn').html('Resend').prop("disabled", false);
        }
    }, 1000);
}