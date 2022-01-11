const openedMenu = document.querySelector('.opened-menu');
const closedMenu = document.querySelector('.closed-menu');
const navbarMenu = document.querySelector('.navbar');
const menuOverlay = document.querySelector('.overlay');

openedMenu.addEventListener('click', toggleMenu);
closedMenu.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

function toggleMenu() {
   navbarMenu.classList.toggle('active');
   menuOverlay.classList.toggle('active');
   document.body.classList.toggle('scrolling');
}

navbarMenu.addEventListener('click', (event) => {
   if (event.target.hasAttribute('data-toggle') && window.innerWidth <= 992) {
      event.preventDefault();
      const menuItemHasChildren = event.target.parentElement;

      if (menuItemHasChildren.classList.contains('active')) {
         collapseSubMenu();
      } else {
         if (navbarMenu.querySelector('.menu-items.active')) {
            collapseSubMenu();
         }
         menuItemHasChildren.classList.add('active');
         const subMenu = menuItemHasChildren.querySelector('.sub-menu');
         subMenu.style.maxHeight = subMenu.scrollHeight + 'px';
      }
   }
});

function collapseSubMenu() {
   navbarMenu.querySelector('.menu-items.active .sub-menu').removeAttribute('style');
   navbarMenu.querySelector('.menu-items.active').classList.remove('active');
}

function resizeScreen() {
   if (navbarMenu.classList.contains('active')) {
      toggleMenu();
   }

   if (navbarMenu.querySelector('.menu-items.active')) {
      collapseSubMenu();
   }
}

window.addEventListener('resize', () => {
   if (this.innerWidth > 992) {
      resizeScreen();
   }
});
