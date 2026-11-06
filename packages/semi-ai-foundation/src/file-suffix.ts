export const IMAGE_SUFFIXES = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];

const FILE_KIND_SUFFIXES = {
    word: ['docx', 'doc', 'txt', 'epub', 'mobi'],
    code: ['js', 'ts', 'jsx', 'tsx', 'java', 'py', 'c', 'cpp', 'go', 'rs', 'php', 'sql', 'html', 'css', 'scss', 'less', 'md', 'json'],
    excel: ['xlsx', 'xls'],
    ppt: ['pptx', 'ppt'],
    video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', '3gp'],
    audio: ['flac', 'wav', 'alac', 'ape', 'mp3', 'aac', 'ogg', 'wma', 'm4a', 'amr', 'mid', 'midi'],
    image: IMAGE_SUFFIXES,
    pdf: ['pdf'],
};

export type FileKind = keyof typeof FILE_KIND_SUFFIXES;

const SUFFIX_KINDS = new Map<string, FileKind>(Object.entries(FILE_KIND_SUFFIXES).flatMap(([kind, suffixes]) => suffixes.map((suffix): [string, FileKind] => [suffix, kind as FileKind])));

/** The kind of a lower-cased file extension; undefined for an extension the table does not list */
export function getFileKind(suffix?: string): FileKind | undefined {
    return SUFFIX_KINDS.get(suffix);
}

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
