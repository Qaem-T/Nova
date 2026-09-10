// "use strict";

// // Elements 
// const navBar = document.querySelectorAll('.nBar');
// const shopCardBtn = document.querySelectorAll('.shopCard-btn');
// const textObserv = document.querySelectorAll('.textObserv');

// // stat Auto-hide navigation: hide on scroll down, show on scroll up
// let lastScrollY = window.scrollY;

// window.addEventListener('scroll', () => {
//     const currentScrollY = window.scrollY;
 
//     if (currentScrollY <= 0) {
//         navBar[0].classList.add('visible');

//     } else if (currentScrollY > lastScrollY) {
//         navBar[0].classList.remove('visible');

//     } else if (currentScrollY < lastScrollY) {
//         navBar[0].classList.add('visible');
//     }
 
//     lastScrollY = currentScrollY;
// }, { passive: true });
// // end Auto-hide navigation 

// // s observer 
// const observer = new IntersectionObserver(entries => {
//     entries.forEach(entry => {
//         if (entry.isIntersecting) {
//             entry.target.classList.add('visible');
//             observer.unobserve(entry.target); // بعد از یک بار دیده شدن نیازی به observe موندن نیست
//         }
//     });
// }, { threshold: 0 });
 
// const observeAll = elements => elements.forEach(el => observer.observe(el));
// // e observer 

// observeAll(navBar);
// observeAll(shopCardBtn);
// observeAll(textObserv);