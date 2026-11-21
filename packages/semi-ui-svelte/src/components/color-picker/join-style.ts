// One style string, because a `style:` directive would beat the caller's `styles` entry for the same property
export const joinStyle = (...parts: (string | undefined)[]) => parts.filter(Boolean).join('; ') || undefined;
