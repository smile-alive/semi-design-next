// jsdom never matches `:popover-open`, so its UA rule hides every popover; an inline `display` beats it, which
// focus-trap/tabbable (`displayCheck: 'full-native'`) need. Production code must not set it.
// A real UA fires `beforetoggle` synchronously before the state changes; jsdom has no ToggleEvent.
export function setupPopover() {
    if ('showPopover' in HTMLElement.prototype) {
        return;
    }
    const openPopovers = new WeakSet<HTMLElement>();
    const beforeToggle = (el: HTMLElement, newState: 'open' | 'closed') => el.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState, oldState: newState === 'open' ? 'closed' : 'open' }));
    Object.assign(HTMLElement.prototype, {
        showPopover(this: HTMLElement) {
            if (openPopovers.has(this)) {
                return;
            }
            beforeToggle(this, 'open');
            openPopovers.add(this);
            this.style.setProperty('display', 'block');
        },
        hidePopover(this: HTMLElement) {
            if (!openPopovers.has(this)) {
                return;
            }
            beforeToggle(this, 'closed');
            openPopovers.delete(this);
            this.style.removeProperty('display');
        },
        togglePopover(this: HTMLElement, force?: boolean) {
            const next = force ?? !openPopovers.has(this);
            if (next) {
                this.showPopover();
            } else {
                this.hidePopover();
            }
            return next;
        },
    });
}
