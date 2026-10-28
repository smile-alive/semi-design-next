// Media events do not bubble and React binds them on the media element itself, so a handler on a wrapping div,
// including its capture variant, is never called.
export type MediaEventKey =
    | 'onAbort'
    | 'onCanPlay'
    | 'onCanPlayThrough'
    | 'onDurationChange'
    | 'onEmptied'
    | 'onEncrypted'
    | 'onEnded'
    | 'onError'
    | 'onLoadedData'
    | 'onLoadedMetadata'
    | 'onLoadStart'
    | 'onPause'
    | 'onPlay'
    | 'onPlaying'
    | 'onProgress'
    | 'onRateChange'
    | 'onSeeked'
    | 'onSeeking'
    | 'onStalled'
    | 'onSuspend'
    | 'onTimeUpdate'
    | 'onVolumeChange'
    | 'onWaiting';

export type MediaEventKeys = MediaEventKey | `${MediaEventKey}Capture`;
