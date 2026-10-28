import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-backtop`,
};

export const strings = {
    // interactive content a native button may not contain
    INTERACTIVE_SELECTOR: [
        'a[href]',
        'area[href]',
        'button',
        'input',
        'select',
        'textarea',
        'details',
        'label',
        'iframe',
        'embed',
        'audio[controls]',
        'video[controls]',
        '[tabindex]',
        '[contenteditable]:not([contenteditable="false"])',
        ...['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'textbox', 'searchbox', 'combobox', 'slider', 'spinbutton'].map((role) => `[role="${role}"]`),
    ].join(','),
};
