// Toast and Notification containers are body singletons; left in the old body they would never show
export function setupSingletonCarry() {
    let carried: Element[] = [];
    document.addEventListener('astro:before-swap', () => {
        carried = [...document.querySelectorAll('body > .semi-toast-wrapper, body > .semi-notification-wrapper')];
    });
    document.addEventListener('astro:after-swap', () => {
        document.body.append(...carried);
    });
}
