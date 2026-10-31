import type { Snippet } from 'svelte';
import type { CheckboxValue } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
import type { EmojiResult, FeedbackValue } from '@fibrae/semi-foundation/feedback/foundation';
import type { CheckboxGroupOptionSnippetProps, CheckboxGroupProps } from '../checkbox/interface.js';
import type { TextAreaChangeEvent, TextAreaProps } from '../input/interface.js';
import type { ModalButtonProps, ModalProps } from '../modal/interface.js';
import type { RadioChangeEvent, RadioGroupOptionSnippetParams, RadioGroupProps } from '../radio/interface.js';
import type { SideSheetProps } from '../side-sheet/interface.js';

export type { CheckboxValue, EmojiResult, FeedbackValue };

export type FeedbackMode = 'modal' | 'popup';
export type FeedbackType = 'text' | 'emoji' | 'radio' | 'checkbox' | 'custom';

/** Same shape as the Modal footer buttons; `onclick` runs before the built-in ok or cancel handling. */
export type FeedbackButtonProps = ModalButtonProps;

/** `value` is Feedback's own; `onChange` is called after Feedback has handled the change. */
export type FeedbackTextAreaProps = Omit<TextAreaProps, 'value'>;
export type FeedbackRadioGroupProps = Omit<RadioGroupProps, 'value'>;
export type FeedbackCheckboxGroupProps = Omit<CheckboxGroupProps, 'value'>;

export type FeedbackRadioSnippetProps = RadioGroupOptionSnippetParams;
export type FeedbackCheckboxSnippetProps = CheckboxGroupOptionSnippetProps;

export interface FeedbackContentSnippetProps {
    /** The built-in content; place it with `{@render content()}`. */
    content: Snippet;
}

/** The props Feedback declares itself; the rest go to the Modal or SideSheet of the current mode. */
export interface FeedbackOwnProps {
    mode?: FeedbackMode;
    type?: FeedbackType;
    /** Bindable. The cancel paths (cancel button, close button, Escape, and for a modal the mask click) write `false`; the ok button never closes. */
    visible?: boolean;
    /** Plain text or a snippet. A string is declared here so `title="x"` is not a native tooltip. */
    title?: string | Snippet;
    textAreaProps?: FeedbackTextAreaProps;
    radioGroupProps?: FeedbackRadioGroupProps;
    checkboxGroupProps?: FeedbackCheckboxGroupProps;
    /** With `okButtonProps.disabled` unset, the ok button is disabled until something is chosen. */
    okButtonProps?: FeedbackButtonProps;
    cancelButtonProps?: FeedbackButtonProps;
    /** A returned Promise keeps the ok button loading until it settles and clears the value once it fulfills. */
    onOk?: (event: MouseEvent) => unknown;
    /** Cancel button, close button, Escape and (modal) mask click. `visible` becomes false once it returns, or once a returned Promise fulfills. */
    onCancel?: (event: MouseEvent | KeyboardEvent) => unknown;
    onValueChange?: (value: FeedbackValue) => void;
    /** Called once the dialog has closed. */
    afterClose?: () => void;
    /** Popup only. */
    afterVisibleChange?: (visible: boolean) => void;
    /** Content of type="custom". */
    children?: Snippet;
    /** Wraps or replaces the built-in content, whatever the type. */
    content?: Snippet<[FeedbackContentSnippetProps]>;
    /** A snippet replaces the default buttons; null renders no footer area. */
    footer?: Snippet | null;
    closeIcon?: Snippet;
    /** Modal only. A snippet replaces the default header; null renders no header. */
    header?: Snippet | null;
    /** Modal only. */
    icon?: Snippet;
    /** Modal only. `modal` is the role="dialog" element; place it with `{@render modal()}`. */
    modal?: Snippet<[{ modal: Snippet }]>;
    radioLabel?: Snippet<[FeedbackRadioSnippetProps]>;
    radioExtra?: Snippet<[FeedbackRadioSnippetProps]>;
    checkboxLabel?: Snippet<[FeedbackCheckboxSnippetProps]>;
    checkboxExtra?: Snippet<[FeedbackCheckboxSnippetProps]>;
}

/** What a template can pass for `mode="modal"`: the Modal props. */
export interface FeedbackModalProps extends Omit<FeedbackOwnProps, 'mode'>, Omit<ModalProps, keyof FeedbackOwnProps> {
    mode: 'modal';
}

/** What a template can pass for `mode="popup"`: the SideSheet props. */
export interface FeedbackSideSheetProps extends FeedbackOwnProps, Omit<SideSheetProps, keyof FeedbackOwnProps> {
    mode?: 'popup';
}

/**
 * Both variants at once: `mode` decides at run time which keys apply. Not a union of the two interfaces above, which
 * TypeScript cannot index once both carry all the HTML attributes.
 */
export type FeedbackProps = FeedbackOwnProps & Omit<ModalProps, keyof FeedbackOwnProps> & Omit<SideSheetProps, keyof FeedbackOwnProps>;

/** Internal props of FeedbackContent */
export interface FeedbackContentProps extends Pick<FeedbackOwnProps, 'children' | 'radioLabel' | 'radioExtra' | 'checkboxLabel' | 'checkboxExtra'> {
    type: FeedbackType;
    value: FeedbackValue | null;
    textAreaProps?: FeedbackTextAreaProps;
    radioGroupProps?: FeedbackRadioGroupProps;
    checkboxGroupProps?: FeedbackCheckboxGroupProps;
    onTextChange: (value: string, event: TextAreaChangeEvent) => void;
    onReasonChange: (value: string, event: TextAreaChangeEvent) => void;
    onEmojiChange: (emoji: string) => void;
    onRadioChange: (event: RadioChangeEvent) => void;
    onCheckboxChange: (value: CheckboxValue[]) => void;
}
