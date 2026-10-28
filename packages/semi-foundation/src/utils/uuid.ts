/** Random unique id, as `${prefix}-${uuid}` when a prefix is given */
export function createId(prefix?: string) {
    const id = crypto.randomUUID();
    return prefix ? `${prefix}-${id}` : id;
}
