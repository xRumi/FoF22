function Alert(o) {
    if (!o) o = {}
	if (!o.corner) o.corner = "top-right";
	if (!o.max_elem) o.max_elem = 10;
    const alert_container = $(`<div class="alert-container alert-${o.corner}"><div>`); $('body').append(alert_container);
    const alert_count = $('.alert').length;
    this.render = (r) => {
        if (!r) r = {};
		const exceptions_param = !r.style || ( r.style != 'info' && r.style != 'success' && r.style != 'danger' && r.style != 'warning');
        r.style = exceptions_param ? 'info' : r.style; 
        if (r.delay == null) r.delay = 5000;
        if (alert_count < o.max_elem) {
            const alert = $(`<div class="alert alert-${r.style}"></div>`).html(`<h3>${r.head}</h3>${r.content ? `<p>${r.content}</p>` : ''}`);
            alert_container.append(alert); if (r.sound) (new Audio(r.sound)).play();
            if (r.click_to_close) alert.click((e) => { let that = $(e.currentTarget); that.addClass('fade-out'); setTimeout(() => that.remove(), 200); });
            if (r.delay) {
                setTimeout(() => alert.addClass('fade-out'), r.delay - 400);
                setTimeout(() => alert.remove(), r.delay);
            }
        }
    }
}
