export function setupMedia() {
    // jsdom has no FontFaceSet; on the prototype so a test can shadow it on `document` and delete its own again
    const fonts = new EventTarget() as FontFaceSet;
    Object.defineProperty(Document.prototype, 'fonts', { configurable: true, get: () => fonts });
    // jsdom has no TextTrack
    const textTracks = new WeakMap<HTMLTrackElement, TextTrack>();
    Object.defineProperty(HTMLTrackElement.prototype, 'track', {
        configurable: true,
        get(this: HTMLTrackElement) {
            let track = textTracks.get(this);
            if (!track) {
                track = { mode: 'disabled' } as TextTrack;
                textTracks.set(this, track);
            }
            return track;
        },
    });

    global.matchMedia = (media) => {
        const min = /min-width:\s*(\d+)px/.exec(media);
        const max = /max-width:\s*(\d+)px/.exec(media);
        return {
            media,
            // user preferences are off unless a test mocks them
            matches: !media.includes('prefers-') && (!min || window.innerWidth >= Number(min[1])) && (!max || window.innerWidth <= Number(max[1])),
            onchange: null,
            dispatchEvent: () => false,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
        };
    };
}
