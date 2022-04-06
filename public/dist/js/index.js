var socket = io();

function ajax (page, url, retry = false, type = 'GET') {
    return new Promise((resolve, reject) => {
        let ajax_ = () => {
            $.ajax({
                type,
                url,
                timeout: 30000,
                success: function (data, textStatus, xhr) {
                    resolve({ data, textStatus, xhr });
                },
                error: function (xhr, textStatus, errorThrown) {
                    if (xhr.status == 403) {
                        window.location.replace(`/login?ref=${page}`);
                        reject({ });
                    }
                }
            });
        }
        ajax_();
    });
}

$('#refresh_friends').click(() => {
    $('#refresh_friends').prop("disabled", true).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="visually-hidden">Refresh</span>`);
    ajax('home', '/friends/fetch').then(x => {
        let html = ['<ul class="list-group list-group-flush">'];
        if (x.data.length) {
            for (let i = 0; i < x.data.length; i++) {
                let friend = x.data[i];
                html.push(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">${friend.username}
                        <span class="badge bg-${friend.status == 'online' ? 'primary' : friend.status == 'idle' ? 'warning' : 'secondary'} rounded-pill">${friend.status}</span>
                    </li>
                `);
            }
        } else html.push(`<p class="card-text">You do not have any <b>friends</b></p>`)
        html.push('</ul>');
        $('#friends_list').html(html.join(''));
        $('#refresh_friends').prop("disabled", false).html('Refresh');
    });
});

