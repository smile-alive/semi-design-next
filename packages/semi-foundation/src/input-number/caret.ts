/** Records the text after the caret, so the caret can follow it when a change reformats the value */
export function recordCaretTail(input: HTMLInputElement | null): string | undefined {
    if (!input) {
        return undefined;
    }
    // selectionStart/End are null on input types without a text selection (number, email); UTF-16 indexes match
    // substring, spreading the string would count code points
    const { selectionStart, selectionEnd, value } = input;
    return value.substring(Math.max(selectionStart ?? 0, selectionEnd ?? 0));
}

/** Puts the caret in front of the longest suffix of the recorded tail that still ends the value */
export function restoreCaretTail(input: HTMLInputElement | null, tail?: string) {
    if (tail === undefined || !input?.value) {
        return;
    }
    for (let start = 0; start < tail.length; start++) {
        if (placeCaretBeforeTail(input, tail.substring(start))) {
            return;
        }
    }
}

function placeCaretBeforeTail(input: HTMLInputElement, tail: string) {
    const index = input.value.lastIndexOf(tail);
    if (index === -1 || index + tail.length !== input.value.length) {
        return false;
    }
    try {
        if (index !== input.selectionStart || index !== input.selectionEnd) {
            input.setSelectionRange(index, index);
        }
    } catch {
        // setSelectionRange throws InvalidStateError on input types without a text selection (number, email);
        // https://html.spec.whatwg.org/multipage/input.html#concept-input-apply
        // the caret stays where the browser put it
    }
    return true;
}
