interface CopyConfigBase {
    content?: string;
    /** Seconds the copied state lasts */
    duration?: number;
}

/** `text` is the copied content when the config gives none; an explicit `undefined` field counts as unset */
export function getCopyConfig<C extends CopyConfigBase>(copyable: C | boolean, text: string): Exclude<C, boolean> & Required<CopyConfigBase> {
    const config = (typeof copyable === 'object' ? copyable : {}) as Exclude<C, boolean>;
    return { ...config, content: config.content ?? text, duration: config.duration ?? 3 };
}
