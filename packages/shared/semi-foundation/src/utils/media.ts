// play() rejects when interrupted by pause() or a new load, or blocked by autoplay policy; fullscreen and
// picture-in-picture reject before metadata loads or where unavailable
const EXPECTED_MEDIA_ERRORS = new Set(['AbortError', 'NotAllowedError', 'InvalidStateError', 'NotSupportedError']);

/** Drops the rejections a media request is expected to meet in normal use; any other rejection stays a rejection. */
export function ignoreExpectedMediaErrors(request: Promise<unknown>): Promise<void> {
    return request.then(
        () => undefined,
        (error: unknown) => {
            if (error instanceof DOMException && EXPECTED_MEDIA_ERRORS.has(error.name)) return;
            throw error;
        }
    );
}
