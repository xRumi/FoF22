const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight,
            sectionTop = current.offsetTop - 50,
            sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.add('active-link')
        }else{
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

function scrollHeader(){
    const header = document.getElementById('header')
    if(this.scrollY >= 80) header.classList.add('scroll-header'); else header.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader);

var hidden_nav = false;

function hide_nav(a) {
    if (!a && hidden_nav) {
        hidden_nav = false;
        $('.nav__menu').css('transform', 'unset');
    } else if (window.matchMedia("(max-width: 767px)").matches && a) {
        hidden_nav = true;
        $('.nav__menu').css('transform', 'translateY(90%)');
    }
}