// Media events do not bubble, so a handler on the wrapping root div, in any of Solid's three spellings, is never called
type MediaEventKey =
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

type NamespacedEventKey<K> = K extends `on${infer Name}` ? `on:${Lowercase<Name>}` : never;

export type MediaEventKeys = MediaEventKey | Lowercase<MediaEventKey> | NamespacedEventKey<MediaEventKey>;
