import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-form`,
};

export const strings = {
    LAYOUT: ['horizontal', 'vertical'],
    DEFAULT_TRIGGER: 'change',
};

/**
 * The props a Form field consumes and never hands to its control. `id` and `name` are not among them: the field passes
 * both on. Each framework adds its own: the change handler, and the slots or snippets the field shell renders.
 */
export const FIELD_PROP_KEYS = [
    'allowEmpty',
    'allowEmptyString',
    'convert',
    'emptyValue',
    'extraText',
    'extraTextPosition',
    'field',
    'fieldClassName',
    'fieldStyle',
    'helpText',
    'initValue',
    'keepState',
    'label',
    'labelAlign',
    'labelCol',
    'labelPosition',
    'labelWidth',
    'noErrorMessage',
    'noLabel',
    'pure',
    'rules',
    'stopValidateWithError',
    'transform',
    'trigger',
    'validateStatus',
    'validator',
    'wrapperCol',
] as const;

export type FieldPropKey = (typeof FIELD_PROP_KEYS)[number];

/** What a field injects into its control besides the value, handlers and aria attributes; none is a DOM attribute */
export const FORM_INJECTED_PROP_KEYS = ['validateStatus', 'insetLabel', 'insetLabelId'] as const;
