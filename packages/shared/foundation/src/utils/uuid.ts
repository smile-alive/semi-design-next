export function createId(prefix?: string) {
    const id = crypto.randomUUID();
    return prefix ? `${prefix}-${id}` : id;
}
