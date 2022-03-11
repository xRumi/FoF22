import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
    }

    async getHtml() {
        return `
            <div class="chat">
                <div class="wrapper">
                    <div class="conversation-area">
                        <div class="msg online">
                        <img class="msg-profile" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%281%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Madison Jones</div>
                                <div class="msg-content">
                                    <span class="msg-message">What time was our meet</span>
                                    <span class="msg-date">20m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%2812%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Miguel Cohen</div>
                                <div class="msg-content">
                                    <span class="msg-message">Adaptogen taiyaki austin jean shorts brunch</span>
                                    <span class="msg-date">20m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg active">
                            <div class="msg-profile group">
                                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"
                                    stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1">
                                    <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5"></path>
                                    <path d="M22 8.5l-10 7-10-7"></path>
                                    <path d="M2 15.5l10-7 10 7M12 2v6.5"></path>
                                </svg>
                            </div>
                            <div class="msg-detail">
                                <div class="msg-username">CodePen Group</div>
                                <div class="msg-content">
                                    <span class="msg-message">Aysenur: I love CSS</span>
                                    <span class="msg-date">28m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg online">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%282%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Lea Debere</div>
                                <div class="msg-content">
                                    <span class="msg-message">Shoreditch iPhone jianbing</span>
                                    <span class="msg-date">45m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg online">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%281%29+%281%29.png"
                                alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Jordan Smith</div>
                                <div class="msg-content">
                                    <span class="msg-message">Snackwave craft beer raclette, beard kombucha </span>
                                    <span class="msg-date">2h</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%284%29+%281%29.png"
                                alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Jared Jackson</div>
                                <div class="msg-content">
                                    <span class="msg-message">Tattooed brooklyn typewriter gastropub</span>
                                    <span class="msg-date">18m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg online">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%283%29+%281%29.png"
                                alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Henry Clark</div>
                                <div class="msg-content">
                                    <span class="msg-message">Ethical typewriter williamsburg lo-fi street art</span>
                                    <span class="msg-date">2h</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile" src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/qs6F3dgm.png"
                                alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Jason Mraz</div>
                                <div class="msg-content">
                                    <span class="msg-message">I'm lucky I'm in love with my best friend</span>
                                    <span class="msg-date">4h</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%288%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Chiwa Lauren</div>
                                <div class="msg-content">
                                    <span class="msg-message">Pabst af 3 wolf moon</span>
                                    <span class="msg-date">28m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%289%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Caroline Orange</div>
                                <div class="msg-content">
                                    <span class="msg-message">Bespoke aesthetic lyft woke cornhole</span>
                                    <span class="msg-date">35m</span>
                                </div>
                            </div>
                        </div>
                        <div class="msg">
                            <img class="msg-profile"
                                src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%286%29.png" alt="">
                            <div class="msg-detail">
                                <div class="msg-username">Lina Ashma</div>
                                <div class="msg-content">
                                    <span class="msg-message">Migas food truck crucifix vexi</span>
                                    <span class="msg-date">42m</span>
                                </div>
                            </div>
                        </div>

                        <div class="overlay"></div>
                    </div>
                    <div class="chat-area">
                        <div class="chat-area-header">
                            <div class="chat-area-title">Message Group</div>
                            <div class="chat-area-group">
                                <img class="chat-area-profile"
                                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%283%29+%281%29.png"
                                    alt="">
                                <img class="chat-area-profile"
                                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%282%29.png" alt="">
                                <img class="chat-area-profile"
                                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%2812%29.png" alt="">
                                <span>+4</span>
                            </div>
                        </div>
                        <div class="chat-area-main">
                            <div class="chat-msg">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%283%29+%281%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 1.22pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Luctus et ultrices posuere cubilia curae.</div>
                                    <div class="chat-msg-text">
                                        <img
                                            src="https://media0.giphy.com/media/yYSSBtDgbbRzq/giphy.gif?cid=ecf05e47344fb5d835f832a976d1007c241548cc4eea4e7e&amp;rid=giphy.gif">
                                    </div>
                                    <div class="chat-msg-text">Neque gravida in fermentum et sollicitudin ac orci phasellus
                                        egestas. Pretium
                                        lectus quam id leo.</div>
                                </div>
                            </div>
                            <div class="chat-msg owner">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%281%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 1.22pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Sit amet risus nullam eget felis eget. Dolor sed viverra
                                        ipsum😂😂😂</div>
                                    <div class="chat-msg-text">Cras mollis nec arcu malesuada tincidunt.</div>
                                </div>
                            </div>
                            <div class="chat-msg">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%282%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 2.45pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Aenean tristique maximus tortor non tincidunt. Vestibulum
                                        ante ipsum primis
                                        in faucibus orci luctus et ultrices posuere cubilia curae😊</div>
                                    <div class="chat-msg-text">Ut faucibus pulvinar elementum integer enim neque volutpat.
                                    </div>
                                </div>
                            </div>
                            <div class="chat-msg owner">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%281%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 2.50pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">posuere eget augue sodales, aliquet posuere eros.</div>
                                    <div class="chat-msg-text">Cras mollis nec arcu malesuada tincidunt.</div>
                                </div>
                            </div>
                            <div class="chat-msg">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%2812%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 3.16pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Egestas tellus rutrum tellus pellentesque</div>
                                </div>
                            </div>
                            <div class="chat-msg">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%283%29+%281%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 3.16pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Consectetur adipiscing elit pellentesque habitant morbi
                                        tristique senectus
                                        et.</div>
                                </div>
                            </div>
                            <div class="chat-msg owner">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%281%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 2.50pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Tincidunt arcu non sodales😂</div>
                                </div>
                            </div>
                            <div class="chat-msg">
                                <div class="chat-msg-profile">
                                    <img class="chat-msg-img"
                                        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/3364143/download+%282%29.png"
                                        alt="">
                                    <div class="chat-msg-date">Message seen 3.16pm</div>
                                </div>
                                <div class="chat-msg-content">
                                    <div class="chat-msg-text">Consectetur adipiscing elit pellentesque habitant morbi
                                        tristique senectus
                                        et🥰</div>
                                </div>
                            </div>
                        </div>
                        <div class="chat-area-footer">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-video">
                                <path d="M23 7l-7 5 7 5V7z"></path>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-image">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <path d="M21 15l-5-5L5 21"></path>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-plus-circle">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 8v8M8 12h8"></path>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-paperclip">
                                <path
                                    d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48">
                                </path>
                            </svg>
                            <input type="text" placeholder="Type something here...">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-smile">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"></path>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                class="feather feather-thumbs-up">
                                <path
                                    d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-area-header">
                            <div class="msg-profile group">
                                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"
                                    stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1">
                                    <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5"></path>
                                    <path d="M22 8.5l-10 7-10-7"></path>
                                    <path d="M2 15.5l10-7 10 7M12 2v6.5"></path>
                                </svg>
                            </div>
                            <div class="detail-title">CodePen Group</div>
                            <div class="detail-subtitle">Created by Aysenur, 1 May 2020</div>
                            <div class="detail-buttons">
                                <button class="detail-button">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                        stroke="currentColor" stroke-width="0" stroke-linecap="round"
                                        stroke-linejoin="round" class="feather feather-phone">
                                        <path
                                            d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z">
                                        </path>
                                    </svg>
                                    Call Group
                                </button>
                                <button class="detail-button">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                        stroke="currentColor" stroke-width="0" stroke-linecap="round"
                                        stroke-linejoin="round" class="feather feather-video">
                                        <path d="M23 7l-7 5 7 5V7z"></path>
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                    </svg>
                                    Video Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}
