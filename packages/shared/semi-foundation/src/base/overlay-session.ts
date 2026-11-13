/**
 * Whether an overlay (Modal, SideSheet, ImagePreview) is shown, that is holds its page resources, and whether a
 * destroy while shown (KeepAlive, Activity, StrictMode replay) owes the showing back on the next init. Each method
 * returns whether the caller takes or releases the resources.
 */
export default class OverlaySession {
    #shown = false;
    #resume = false;

    /** A showing begins; false when one is already going on */
    begin() {
        if (this.#shown) {
            return false;
        }
        this.#shown = true;
        return true;
    }

    /** The showing ends, and a suspended one no longer resumes; false when none is going on */
    end() {
        this.#resume = false;
        if (!this.#shown) {
            return false;
        }
        this.#shown = false;
        return true;
    }

    /** The host destroys the foundation: a showing going on ends and begins again on the next `resume` */
    suspend() {
        if (!this.end()) {
            return false;
        }
        this.#resume = true;
        return true;
    }

    /** The host initializes the foundation again: true when a suspended showing must begin again */
    resume() {
        const resume = this.#resume;
        this.#resume = false;
        return resume;
    }
}
