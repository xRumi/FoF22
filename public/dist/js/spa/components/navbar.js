export default class Navbar extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <nav class="nav">
                <a href="#" class="nav__logo">FoF22</a>
                <div class="nav__menu" id="nav-menu">

                    <ul class="nav__list">
                        <li class="nav__item">
                            <a id="nav__link__home" href="/spa" class="nav__link" data-link>
                                <i class='bx bx-home-alt nav__icon'></i>
                                <span class="nav__name">Home</span>
                            </a>
                        </li>
                        
                        <li class="nav__item">
                            <a id="nav__link__profile" href="/spa/profile" class="nav__link" data-link>
                                <i class='bx bx-user nav__icon'></i>
                                <span class="nav__name">Profile</span>
                            </a>
                        </li>

                        <li class="nav__item">
                            <a id="nav__link__messages" href="/spa/messages" class="nav__link" data-link>
                                <i class='bx bx-chat nav__icon'></i>
                                <span class="nav__name">Messages</span>
                            </a>
                        </li>

                        <li class="nav__item">
                            <a id="nav__link__search" href="/spa/search" class="nav__link" data-link>
                                <i class='bx bx-search nav__icon'></i>
                                <span class="nav__name">Search</span>
                            </a>
                        </li>

                        <li class="nav__item">
                            <a id="nav__link__menu" href="/spa/menu" class="nav__link" data-link>
                                <i class='bx bx-cog nav__icon'></i>
                                <span class="nav__name">Menu</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="nav__img">
                    <img src="/dist/img/profile/rumi.png" alt="">
                </div>
            </nav>
        `;
        $('.nav a[data-link]').off('click');
        $('.nav a[data-link]').on('click', e => {
            e.preventDefault();
            $.fn.navigateTo($(e.currentTarget).attr('href'));
        });

    }
}

customElements.define("nav-bar", Navbar);
