/** A generic div cannot carry a name, so a labelled one becomes a group */
export function isLabelled(attrs: Record<string, unknown>) {
    return Boolean(attrs['aria-label'] || attrs['aria-labelledby']);
}

export function groupRole(attrs: Record<string, unknown>) {
    return (attrs.role as string | undefined) ?? (isLabelled(attrs) ? 'group' : undefined);
}
