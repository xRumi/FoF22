import Constructor from "./constructor.js";

const attachment_limit = 10;
let attachments = [],
    old_people_list = [],
    _ajax0 = false,
    loading_more_messages = false,
    is_private,
    members = [];

const mime_types = {
    'image/png': ['png'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/gif': ['gif'],
    'application/pdf': ['pdf'],
    'application/vnd.android.package-archive': ['apk'],
}

const people_list = (new_people_list) => {
    if (new_people_list && JSON.stringify(new_people_list) == JSON.stringify(old_people_list)) return false;
    if (new_people_list) old_people_list = new_people_list;
    if (old_people_list && old_people_list.length && Array.isArray(old_people_list)) $('.people-list').html(old_people_list.map(x => {
        return $(`
            <div data-id="${x.id}" class="_people${client.messages.room_id == x.id ? ' _people-active' : ''}${x.unread ? ` _people-unread` : ''}">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">${parse_message_time(x.time, true)}</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${!x.deleted ? `${x.has_attachment ? 
                        `<i class="bx bx-paperclip"></i> ` : ''}
                        <span>${x.last_message ? x.last_message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
                    </p>
                </div>
            </div>
        `).on('click', (e) => {
            attachments = [];
            $('#message-input-file-text').text('No file selected');
            $('.message-input-files-preview').html('');
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            $('#message-input').prop('disabled', true);
            $('#message-input-files-button').prop('disabled', true);
            $('.message-send-icon').hide();
            $('.messages-info').hide();
            $('.load-more-messages .spinner').hide();
            $('.load-more-messages').hide();
            $('.messages-list').html('');
            $('._people-active').removeClass('_people-active');
            let _people = $(e.currentTarget);
            _people.addClass('_people-active');
            client.messages.room_id = _people.data('id');
            socket.emit('join-room', client.messages.room_id, (response) => join_room(response));
            history.pushState(null, null, `/spa/messages/${client.messages.room_id}`);
            let name = e.currentTarget.querySelector('._people-name');
            if (name && name.innerHTML) {
                document.title = name.innerHTML;
                $('.messages-header-back-text').text(name.innerHTML);
            }
            nanobar.go(40);
        });
    }));
}

function fetch_people() {
    if (!_ajax0) {
        _ajax0 = true;
        nanobar.go(30);
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                if (!result.length) $('.people-list').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
                else people_list(result);
                _ajax0 = false;
                nanobar.go(100);
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
                _ajax0 = false;
            },
        });
    }
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle('Messages');
        navbar('#nav__link__messages', true); 
        fetch_people();
    }

    async render() {
        return $(`
            <div class="chat">
                <div class="people">
                    <div class="people-header"></div>
                    <div class="people-list scrollbar">
                        <svg class="spinner" style="width: 30px; margin-left: 30px; margin-top: 20px;" viewBox="0 0 50 50">
                            <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                        </svg>
                    </div>
                </div>
                <div class="messages">
                    <div class="messages-header header-back">
                        <div class="header-back-icon">
                            <i class='bx bx-chevron-left'></i>
                        </div>
                        <p class="messages-header-back-text header-back-text"></p>
                    </div>
                    <div class="messages-info" style="display: none;">
                        <div class="messages-info-text"></div>
                        <i class="bx bx-dots-vertical"></i>
                    </div>
                    <div class="load-more-messages" style="display: none;">
                        See Older Messages
                        <svg class="spinner" style="width: 20px; height: 20px; margin-left: 10px; position: relative; margin-bottom: -6px; display: none;" viewBox="0 0 50 50">
                            <circle class="spinner-path" style="stroke: black;" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                        </svg>
                    </div>
                    <div class="messages-list scrollbar"></div>
                    <div class="messages-bottom">
                        <form autocomplete="off">
                            <input type="text" name="message-input" id="message-input" placeholder="type your message..." disabled>
                            <button type="submit" style="outline: none; border: none; background-color: unset; margin-left: -5px;">
                                <i style="display: none;" class='bx bx-send message-send-icon'></i>
                            </button>
                            <div id="message-input-files">
                                ${window.FileReader ? `
                                    <input id="message-input-files-button" type="button" value="upload" disabled> <span id="message-input-file-text" style="margin-left: 5px; font-size: 13px;">No file selected</span>
                                    <input type="file" style="display: none;" accept=".jpeg,.jpg,.png,.gif,.pdf,.apk">
                                ` : `<span style="color: grey;">does not support file reader</span>`}
                            </div>
                            <div class="message-input-files-preview"></div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="profile-" style="display: none;"></div>
        `).on('submit', '.messages-bottom form', (e) => {
            e.preventDefault();
            let input = $('#message-input'),
                _message = input.val();
            if ((!_message && !attachments.length) || !client.messages.room_id) return $('.message-send-icon').shake();
            input.val(''); let _id = Math.random().toString(36).substring(2, 15);
            $('#message-input-file-text').text('No file selected');
            $('.message-input-files-preview').html('');
            $('.messages-list').append(`
                <div id="${_id}" class="message outgoing pending-message" data-username="${client.username}">
                    <div class="message-content">
                        ${format_attachment(attachments)}
                        ${_message ? '<p>' + _message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                    </div>
                    <div class="message-error"></div>
                </div>
            `).on('click', `#${_id} .message-error button`, e => {
                $(`#${_id} .message-error`).hide();
                $(`#${_id} .message-content`).show();
                do_send_message();
            });
            let _attachments = attachments.filter(x => x.file).map(x => Object.assign({}, x));
            function do_send_message() {
                send_message(_message, _attachments, _id, (response) => {
                    if (response.error) {
                        $(`#${_id} .message-content`).hide();
                        $(`#${_id} .message-error`).html(`
                            <div>Failed to send message</div>
                            <button>Resend</button>
                        `).show();
                        _alert.render({
                            head: 'Message Deliver Error',
                            content: response.error,
                            click_to_close: true,
                            delay: 5000
                        });
                        console.log(response.error);
                    } else {
                        const { id, chat, _id } = response;
                        if (client.messages.room_id == id) {
                            let message = $(`#${_id}`);
                            if (message.length) {
                                message.removeClass('pending-message');
                                message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
                                let prev_message = message.prev()[0];
                                let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-foot') : false;
                                if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
                                message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-foot"><span class="message-time">${parse_message_time(chat.time)}</span></div>`);
                                $(`._people[data-id="${id}"]`).find('._people-content p').html(`${!chat.deleted ? `${chat.attachments && chat.attachments.length ? 
                                    `<i class="bx bx-paperclip"></i> ` : ''}
                                    <span>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
                                `);
                            }
                            $('.message.outgoing:not(:last-child) .message-foot .message-seen').remove();
                        }
                    }
                });
                attachments = [];
                $(".message:last-child")[0].scrollIntoView();
            };
            do_send_message();
        }).on('click', '.header-back-icon', e => {
            history.pushState(null, null, `/spa/messages`);
            socket.emit('leave-room', client.messages.room_id);
            client.messages.room_id = null;
            document.title = 'Messages';
            $('.chat').removeClass('chat-active');
            $('.navbar').removeClass('chat-active');
        }).on('click', '.load-more-messages', e => {
            if (loading_more_messages) return false;
            $('.load-more-messages .spinner').show();
            loading_more_messages = true;
            load_more_messages();
        }).on('click', '#message-input-files input:button', (e) => {
            e.preventDefault();
            $(e.currentTarget).parent().find('input:file').trigger('click');
        }).on('change', '#message-input-files input:file', (e) => {
            let files = e.target.files;
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                if (file.size > 20 * 1024 * 1024) {
                    alert(`Upload limit 20mb, skipping ${file.name}`);
                    continue;
                } else if (attachments.some(x => x.name == file.name && file.type == x.type && file.size == x.size && x.lastModified == file.lastModified)) {
                    alert(`Duplicate file, skipping ${file.name}`);
                    continue;
                } else if (!file.name) {
                    alert('File does not have any name, skipping');
                    continue;
                }

                let mime_ext = mime_types[file.type];

                console.log(file.type);
                
                if (!mime_ext || !mime_ext.length) {
                    alert(`File type is not supported, skipping ${file.name}`);
                    continue;
                }

                let ext = file.name.split('.').pop();
                
                if (!ext) {
                    alert(`File does not have an extension, skipping ${file.name}`);
                    continue;
                }

                if (!mime_ext.includes(ext)) {
                    alert(`File extension ${ext} is not supported, skipping ${file.name}`);
                    continue;
                }

                if (!URL.createObjectURL) {
                    alert('Your browser does not support representing file using createObjectURL');
                    break;
                }

                let attachment_length = attachments.length + 1;
                if (attachment_length >= attachment_limit) {
                    $('#message-input-files-button').prop('disabled', true);
                    $('#message-input-file-text').text(`limit reached, click to remove`);
                    break;
                } else $('#message-input-file-text').text(`${attachment_length} file${attachment_length > 1 ? 's' : ''} selected, click to remove`);
                let attachment_data = {
                    id: Math.random().toString(36).substring(2, 15),
                    name: file.name.split('.').slice(0, -1).join('.'),
                    type: file.type,
                    ext,
                    size: file.size,
                    lastModified: file.lastModified,
                };
                attachments.push(attachment_data);
                if (file.type.match('image')) {
                    let image = new Image(), src_url = URL.createObjectURL(file);
                    image.src = src_url;
                    image.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        let ctx = canvas.getContext('2d');
                        ctx.drawImage(image, 0, 0);
                        canvas.toBlob(blob => {
                            $('.message-input-files-preview').append(image);
                            attachment_data.file = file;
                            attachment_data.src_url = src_url;
                            attachment_data.ext = 'jpg';
                        }, 'image/jpeg', 0.8);
                    }
                } else {
                    attachment_data.src_url = URL.createObjectURL(file);
                    attachment_data.file = file;
                }
            }
            $(e.currentTarget).val('');
        }).on('click', '.message-input-files-preview', (e) => {
            let that = $(e.target);
            let attachment_index = attachments.findIndex(x => x.name == that.data('name') && x.type == that.data('type') && x.size == that.data('size') && x.lastModified == that.data('lastmodified'));
            if (attachment_index > -1) {
                attachments.splice(attachment_index, 1);
                that.remove();
                $('#message-input-files-button').prop('disabled', false);
                let attachment_length = attachments.length;
                $('#message-input-file-text').text(attachment_length ? `${attachment_length} file${attachment_length > 1 ? 's' : ''} selected, click to remove` : 'No file selected');
            }
        }).on('click', '.message-content img', (e) => {
            let that = $(e.currentTarget).clone();
            history.pushState(null, null, window.location.href.replace(window.location.origin, ""));
            $('.model-view .model-content').html(that);
            $('.model-view .model-caption').text(that.data('name'));
            $('.model-view').show();
            if (e.currentTarget.dataset.url) {
                $('.model-view .model-actions .model-download').attr({
                    'href': that.data('url'),
                    'download': that.data('name') + '.jpg'
                }).show();
                $('.model-view .model-actions .model-full-view')
                    .attr('href', that.data('url')).show();
            } else {
                // may not work
                // $('.model-view .model-actions .model-download').attr({ 'href': ("data:image/png;base64," + e.currentTarget.src), 'download': (e.currentTarget.dataset.name || 'unknown.png') }).show();
            }
        });
    }

    async after_render() {
        if (!client.messages.npr) people_list();
        else fetch_people();
        if (this.id) {
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            client.messages.room_id = this.id;
            if (socket.connected) socket.emit('join-room', this.id, (response) => join_room(response));
            else {
                socket.on('connect', () => {
                    setTimeout(() => socket.emit('join-room', this.id, (response) => join_room(response)), 1000);
                });
            }
        }
    }

    async before_new_render() {
        socket.emit('leave-room', client.messages.room_id);
        client.messages.room_id = null;
        $('.chat').removeClass('chat-active');
        $('.navbar').removeClass('chat-active');
    }
}

socket.on('receive-message', ({ id, chat, _id }) => {
    if (client.messages.room_id == id) {
        let message = $(`#${_id}`);
        if (message.length) {
            message.removeClass('pending-message');
            message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
            let prev_message = message.prev()[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-foot') : false;
            if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
            message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-foot"><span class="message-time">${parse_message_time(chat.time)}</span></div>`);
        } else {
            let prev_message = client.id == chat.user ? $('.message:last-child.outgoing')[0] : $('.message:last-child:not(.outgoing)')[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.message-foot') : false;
            if (prev_message_time && prev_message_time.innerText && Math.abs(parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
            $('.messages-list').append(format_message(m));
        }
        if (chat.user == client.id) $('.message.outgoing:not(:last-child) .message-foot .message-seen').remove();
        $(`._people[data-id="${id}"]`).find('._people-content p').html(`${!chat.deleted ? `${chat.attachments && chat.attachments.length ? 
            `<i class="bx bx-paperclip"></i> ` : ''}
            <span>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
        `);
    }
});

/*
    *** deletes a message ***

    socket.emit('delete-message', { id: message.data('id'), _id: client.messages.room_id}, ({ id, done }) => {
        let message = $(`[data-id="${id}"]`);
        let message_content_p = message.find('.message-content p');
        if (done) {
            message.addClass('message-deleted');
            message_content_p.css('background-color', '').text('This message was deleted');
        } else message.find('.message-content p').css('background-color', '');
    });

*/

socket.on('member-presence-update', ({ id, username, name, status, date }) => {
    if (is_private) {
        if (id !== client.id) {
            messages_info_header_text({
                is_private: true,
                members: [{ id, username, name, status, date }]
            });
        }
    }
});

socket.on('update-message', ({ id, chat }) => {
    if (client.messages.room_id == id) {
        let message = $(`[data-id="${chat.id}"]`);
        if (message.length) {
            let message_content_p = message.find('.message-content p');
            if (chat.message) {
                message_content_p.css('background-color', '').text(chat.message);
            } else {
                message.addClass('message-deleted');
                message_content_p.css('background-color', '').text('This message was deleted');
            }
        }
    }
});

socket.on('seen-message', ({ id, seen_by }) => {
    let tm = $(`.outgoing[data-id=${id}]`);
    if (tm.length) {
        if (is_private && seen_by.includes(is_private)) 
            tm.find('.message-foot').prepend(`<b>seen</b> • `);
    }
});

function parse_message_time(message_time, minimal) {
    let _time = new Date(message_time),
        diff = Math.abs(Date.now() - message_time), time;
    if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
    else if (diff < periods.day && _time.getDate() === today.getDate()) time = `${!minimal ? `Today at ` : ''}${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
    else {
        if (diff < periods.week) time = `${days[_time.getDay()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}`;
        else time = `${_time.getDate()} ${months[_time.getMonth()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}${_time.getFullYear() !== today.getFullYear() ? `, ${_time.getFullYear()}` : ''}`
    }
    return time;
}

function message_time(html, callback, last_message = {}) {
    let messages = $(html.join('')).filter('.message, .system-message').toArray(), seen_by = '';
    let messages_group = messages.reduce((p, c, i, a) => {
        if (c.classList.contains('system-message')) p.push(c);
        else if (a[i - 1] && c.classList.contains('outgoing') === a[i - 1].classList.contains('outgoing')) p[p.length - 1].constructor === Array ? p[p.length - 1].push(c) : p.push([c]);
        else p.push(a[i + 1] && c.classList.contains('outgoing') === a[i + 1].classList.contains('outgoing') ? [c] : [c]);
        return p;
    }, []);
    if (is_private && last_message.seen_by && last_message.seen_by.length && last_message.user == client.id) seen_by = is_seen(last_message, is_private);
    for (let i = 0; i < messages_group.length; i++) {
        if (messages_group[i].constructor !== Array) continue;
        else if (messages_group[i].length == 1) {
            let message = messages_group[i][0];
            message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-foot"><span class="message-time">${parse_message_time(parseInt(message.dataset.time))}</span></div>`);
        } else {
            for (let j = 0; j < messages_group[i].length; j++) {
                let message = messages_group[i][j];
                let next_message = messages_group[i][j + 1] ? messages_group[i][j + 1] : false;
                let time = parse_message_time(parseInt(message.dataset.time));
                if (next_message) {
                    if (Math.abs(parseInt(message.dataset.time) - parseInt(next_message.dataset.time)) > 7 * 60 * 1000)
                        message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-foot"><span class="message-time">${time}</span></div>`);
                } else message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-foot"><span class="message-time">${time}</span></div>`);
            }
        }
    }
    callback(Array.prototype.concat.apply([], messages_group), seen_by);
}

function is_seen(last_message, other_member) {
    if (last_message.seen_by.includes(other_member)) {
        return '<span class="message-seen"><b>seen</b> • </span>';
    }
}

function join_room(response) {
    nanobar.go(60); if (response.error) {
        let { id, error } = response;
        if (client.messages.room_id == id) $('.messages-list').append(error);
        $('.messages-list .spinner').hide();
    } else {
        let { chat_data, messages, id, name, mm } = response;
        if (client.messages.room_id == id) {
            document.title = name;
            client.messages.room_name = name;
            $('.messages-header-back-text').text(name);
            let html = [], lm = {};
            for (let i = 0; i < messages.length; i++) {
                let m = messages[i];
                html.push(format_message(m, lm));
                lm = m;
            }
            messages_info_header_text(chat_data);
            message_time(html, (_html, seen_by) => {
                $('.messages-list').html(_html);
                $('.messages-list .message:last-child.outgoing .message-foot').prepend(seen_by || '');
                $('#message-input').prop('disabled', false);
                $('#message-input-files-button').prop('disabled', false);
                $('.message-send-icon').show();
                if ($(".message:last-child")[0]) $(".message:last-child")[0].scrollIntoView();
            }, messages[messages.length - 1]);
            if (mm) $('.load-more-messages').show();
            $(`._people[data-id="${id}"]`).css('background-color', '');
            nanobar.go(100);
        }
    }
}

function send_message(_message, _attachments, _id, callback) {
    if (!client.messages.room_id) return false;
    Promise.all(_attachments.map(attachment => {
        return new Promise((resolve, reject) => {
            upload_attachment(attachment, (result, errorThrown) => {
                if (result) {
                    attachment.url = result;
                    resolve(attachment);
                } else reject(errorThrown);
            });
        });
    })).then(x => {
        _attachments = x;
        _send_message(_message, x.map(y => ({
            name: y.name,
            type: y.type,
            ext: y.ext,
            url: y.url
        })), _id, callback);
    }).catch(x => {
        console.log(x);
        callback({ error: x || 'no response' });
    });
}

function upload_attachment(attachment, callback) {
    if (attachment.url) return callback(attachment.url);
    let form_data = new FormData();
    form_data.append('room_id', client.messages.room_id);
    form_data.append('attachment', attachment.file, 'attachment.' + attachment.ext);
    $.ajax({
        type: 'POST',
        url: '/upload/room',
        data: form_data,
        processData: false,
        contentType: false,
        timeout: 30000,
        success: (result, textStatus, xhr) => {
            $(`#${attachment.id}`).attr('data-url', result);
            callback(result);
        },
        error: (xhr, textStatus, errorThrown) => {
            if (xhr.code == 403) window.location.replace(`/login?ref=/spa/messages/${client.messages.room_id}`);
            else callback(false, xhr.responseText);
        }
    });
}

function _send_message(_message, _attachments, _id, callback) {
    socket.emit('send-message', ({ id: client.messages.room_id, _message, _id, _attachments }), (response) => {
        if (response.success) callback(response);
        else if (response.join_room) socket.emit('join-room', client.messages.room_id, () => send_message(_message, _attachments, _id, callback));
        else if (response.error) callback({ error: response.error });
    });
}

function messages_info_header_text(chat_data) {
    if (chat_data.is_private) {
        let other_member = chat_data.members.find(x => x.id !== client.id); is_private = other_member ? other_member.id : false;
        if (other_member) $('.messages-info-text').attr({ 'data-id': other_member.id ,'data-status': other_member.status, 'data-date': other_member.date }).html(other_member ?
            other_member.status == 'online' ?
                `<span style="color: green;">online</span>` :
                other_member.date ? 
                `active ${active_ago(other_member.date)}` :
                `offline`
            : `offline`).parent().show();
    }
}

setTimeout(() => setInterval(() => {
    if (client.messages.room_id) {
        $('.messages-list .message .message-foot .message-time').toArray().forEach(x => {
            let message = x.parentNode.parentNode.parentNode,
                diff = Date.now() - parseInt(message.dataset.time);
            if (diff < 2 * 60 * 60 * 1000) {
                let time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
                x.innerText = time;
            }
        }); 
        let mit = $('.messages-info-text[data-status=offline]');
        if (mit.length) messages_info_header_text({ is_private, members: [{ id: mit.data('id'), status: mit.data('status'), date: mit.data('date') }] });
    }
}, 60000), (60 - n_time.getSeconds()) * 1000);

function active_ago(time_) {
    let _time = new Date(time_),
        diff = Math.abs(Date.now() - _time);
    return Math.floor(diff / periods.day) ? Math.floor(diff / periods.day) + 'd ago' : Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
}

$.fn.chat_show_profile = async (id) => {
    if (!id) return false;
    let profile = $.fn.routes.find(x => x.path == '/spa/profile');
    if (!profile) return false;
    let previous_location = window.location.pathname;
    history.pushState(null, null, `/spa/profile/${id}`);
    let view = new profile.view({ id });
    let html = await view.render();
    $('.chat').hide();
    $('.profile-').html(html).show();
    $.fn._go_back = () => {
        history.pushState(null, null, previous_location);
        document.title = client.messages.room_name || 'Messages';
        $('.chat').show();
        $('.profile-').html('');
    }
}

function format_attachment(attachments) {
    
    return '<div class="msg-attachments">' + attachments.map(x => {
        if (!x) return '';
        return x.type.match('image') ? `<img ${x.id ? `id="${x.id}"` : ''} src="${x.src_url || x.url}" data-name="${x.name}" ${x.url ? `data-url="${x.url}"` : ``}>` :
            `<a ${x.id ? `id="${x.id}"` : ''} class="message-file" href="${x.url || x.src_url}" download="${x.ext ? (x.name + '.' + x.ext) : x.name}" ${x.url ? `data-url="${x.url}"` : ''}>
                <div class="message-file-icon"><i class="bx bx-file"></i></div>
                <div class="message-file-name">${x.ext ? (x.name + '.' + x.ext) : x.name}</div>
                <div class="message-file-size">${x.size ? filesize(x.size) : '∞'}</div>
            </a>`;
    }).join('') + '</div>';
}

function filesize(bytes, si = false, dp = 1) {
    if (isNaN(bytes)) return '∞';
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = si 
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[u];
}

function format_message(m, lm = {}) {
    return m.user == '61d001de9b64b8c435985da9' ? `<div class="system-message" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">${m.message}</div>` : `
        <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${m.deleted ? ' message-deleted' : ''}" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">
            <div class="message-img">
                <img src="/uploads/users/${m.user}/profile.png" onclick="$.fn.chat_show_profile('${m.user}');">
            </div>
            <div class="message-content">
                ${!m.deleted ? `
                    ${format_attachment(m.attachments)}
                    ${m.message ? '<p>' + m.message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                ` : `<p><i>This message was deleted</i>`}
            </div>
        </div>
    `
}

function load_more_messages() {
    if (!client.messages.room_id) {
        $('.load-more-messages .spinner').hide();
        return false;
    }
    socket.emit('load-more-messages', $('.message')[0].getAttribute('data-id'), (response) => {
        if (!response) socket.emit('join-room', client.messages.room_id, () => load_more_messages());
        else {
            let { id, messages, mm } = response;
            loading_more_messages = false;
            if (client.messages.room_id == id && messages.length) {
                let html = [], lm = {};
                for (let i = 0; i < messages.length; i++) {
                    let m = messages[i];
                    html.push(format_message(m, lm));
                    lm = m;
                }
                message_time(html, (_html) => {
                    $('.messages-list').prepend(_html);
                    $('.load-more-messages .spinner').hide();
                }, {});
            } else $('.load-more-messages .spinner').hide();
            if (!mm) $('.load-more-messages').hide();
        }
    });
}
