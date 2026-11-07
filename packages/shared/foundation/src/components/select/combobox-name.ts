export interface ComboboxName {
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
}

/**
 * The single name source of a Select-like combobox: aria-labelledby, aria-label, the inset label (WCAG 2.5.3), then
 * the locale default. The popup (listbox, tree) binds the same object, since ARIA requires it to be named and the
 * combobox would name it by its value. Both keys are always present, so spreading the result replaces the unused one.
 */
export function comboboxName(labelledby?: string, label?: string, insetLabelId?: string, fallback?: string): ComboboxName {
    if (labelledby) {
        // accname reads aria-label only when the ids resolve to nothing
        return { 'aria-label': label, 'aria-labelledby': labelledby };
    }
    if (label) {
        return { 'aria-label': label, 'aria-labelledby': undefined };
    }
    return { 'aria-label': insetLabelId ? undefined : fallback, 'aria-labelledby': insetLabelId };
}
