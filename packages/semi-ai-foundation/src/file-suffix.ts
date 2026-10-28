export const IMAGE_SUFFIXES = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];

/** The lower-cased extension of a file name; undefined when it has none, as for `README` or `.env` */
export function getFileSuffix(name?: string): string | undefined {
    const dot = name?.lastIndexOf('.') ?? -1;
    return dot > 0 ? name.slice(dot + 1).toLowerCase() || undefined : undefined;
}

export function getFileType(name?: string, mime?: string): string | undefined {
    return getFileSuffix(name) ?? mime?.split('/').pop();
}

export function isImageFile(name?: string, mime?: string) {
    return Boolean(mime?.startsWith('image/')) || IMAGE_SUFFIXES.includes(getFileSuffix(name));
}
