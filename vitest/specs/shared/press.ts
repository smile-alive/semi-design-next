import userEvent from '@testing-library/user-event';

/** `checkPattern`'s `press` on user-event's keyboard; `Shift+Tab` is the only chord */
export async function press(key: string) {
    await userEvent.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`);
}
