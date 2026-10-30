import type { InputModelModifiers, ModelModifiers } from './interface';

function looseToNumber(text: string) {
    const number = parseFloat(text);
    return Number.isNaN(number) ? text : number;
}

// Typing (input, IME composition end) is held back under .lazy; the clear button and blur truncation still apply at once.
export const defersUpdate = (event: unknown, modifiers?: InputModelModifiers) => Boolean(modifiers?.lazy) && ['input', 'compositionend'].includes((event as Event).type);

// Mirrors vModelText.beforeUpdate: a typed value ("a " under .trim, "1." under .number) must not be overwritten, or a
// space or decimal point could never be typed.
export const keepsTypedValue = (domValue: string, modelValue?: string | number, modifiers?: ModelModifiers) => (Boolean(modifiers?.trim) && domValue.trim() === modelValue) || (Boolean(modifiers?.number) && looseToNumber(domValue) === modelValue);
