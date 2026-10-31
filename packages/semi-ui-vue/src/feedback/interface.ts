import type { HTMLAttributes, StyleValue, VNode } from 'vue';
import type { CheckboxValue } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
import type { EmojiResult, FeedbackValue } from '@fibrae/semi-foundation/feedback/foundation';
import type { CheckboxGroupOptionSlotProps, CheckboxGroupProps } from '../checkbox/interface';
import type { TextAreaChangeEvent, TextAreaProps } from '../input/interface';
import type { ModalButtonProps, ModalProps } from '../modal/interface';
import type { RadioChangeEvent, RadioGroupOptionSlotProps, RadioGroupProps } from '../radio/interface';
import type { SideSheetProps } from '../side-sheet/interface';

export type { CheckboxValue, EmojiResult, FeedbackValue };

export type FeedbackMode = 'modal' | 'popup';
export type FeedbackType = 'text' | 'emoji' | 'radio' | 'checkbox' | 'custom';

/** Same shape as the Modal footer buttons; `onClick` runs before the built-in ok or cancel handling. */
export type FeedbackButtonProps = ModalButtonProps;

/** `modelValue` is Feedback's own; `onChange` is called after Feedback has handled the change. */
export type FeedbackTextAreaProps = Omit<TextAreaProps, 'modelValue'> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onChange?: (value: string, event: TextAreaChangeEvent) => void;
};
export type FeedbackRadioGroupProps = Omit<RadioGroupProps, 'modelValue'> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onChange?: (event: RadioChangeEvent) => void;
};
export type FeedbackCheckboxGroupProps = Omit<CheckboxGroupProps, 'modelValue'> & {
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onChange?: (value: CheckboxValue[]) => void;
};

/** The props Feedback declares itself; the rest go to the Modal or SideSheet of the current mode as attrs. */
export interface FeedbackProps {
    mode?: FeedbackMode;
    type?: FeedbackType;
    visible?: boolean;
    /** Plain-text title; the `#title` slot wins. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    textAreaProps?: FeedbackTextAreaProps;
    radioGroupProps?: FeedbackRadioGroupProps;
    checkboxGroupProps?: FeedbackCheckboxGroupProps;
    /** With `okButtonProps.disabled` unset, the ok button is disabled until something is chosen. */
    okButtonProps?: FeedbackButtonProps;
    cancelButtonProps?: FeedbackButtonProps;
    /** A returned Promise keeps the ok button loading until it settles and clears the value once it fulfills. */
    onOk?: (event: MouseEvent) => Promise<unknown> | void;
    /**
     * Cancel button, close button, Escape and (modal) mask click. `update:visible` follows once it returns, or once a
     * returned Promise fulfills.
     */
    onCancel?: (event: MouseEvent | KeyboardEvent) => Promise<unknown> | void;
}

/** What a template can pass for `mode="modal"`: the Modal props, which fall through to the Modal. */
export interface FeedbackModalProps extends Omit<FeedbackProps, 'mode'>, Omit<ModalProps, keyof FeedbackProps> {
    mode: 'modal';
}

/** What a template can pass for `mode="popup"`: the SideSheet props, which fall through to the SideSheet. */
export interface FeedbackSideSheetProps extends Omit<FeedbackProps, 'mode'>, Omit<SideSheetProps, keyof FeedbackProps> {
    mode?: 'popup';
}

export type FeedbackFullProps = FeedbackModalProps | FeedbackSideSheetProps;

export interface FeedbackEmits {
    /** Only the cancel paths report false; the ok button never closes. */
    'update:visible': [visible: boolean];
    valueChange: [value: FeedbackValue];
    afterClose: [];
    /** Popup only. */
    afterVisibleChange: [visible: boolean];
}

export interface FeedbackContentSlotProps {
    /** The built-in content; place it with `<component :is="content" />`. */
    content: VNode;
}

export interface FeedbackModalSlotProps {
    /** The role="dialog" element; place it with `<component :is="modal" />`. */
    modal: VNode;
}

export type FeedbackRadioSlotProps = RadioGroupOptionSlotProps;
export type FeedbackCheckboxSlotProps = CheckboxGroupOptionSlotProps;

export interface FeedbackSlots {
    /** Content of type="custom". */
    default?: () => VNode[];
    /** Wraps or replaces the built-in content, whatever the type. */
    content?: (props: FeedbackContentSlotProps) => VNode[];
    title?: () => VNode[];
    /** Given (even empty), it replaces the default buttons; an empty footer renders no footer area. */
    footer?: () => VNode[];
    closeIcon?: () => VNode[];
    /** Modal only. */
    header?: () => VNode[];
    /** Modal only. */
    icon?: () => VNode[];
    /** Modal only. */
    modal?: (props: FeedbackModalSlotProps) => VNode[];
    radioLabel?: (props: FeedbackRadioSlotProps) => VNode[];
    radioExtra?: (props: FeedbackRadioSlotProps) => VNode[];
    checkboxLabel?: (props: FeedbackCheckboxSlotProps) => VNode[];
    checkboxExtra?: (props: FeedbackCheckboxSlotProps) => VNode[];
}

export interface FeedbackHandle {
    /** The outer element of the Modal or SideSheet inside the portal; null while nothing is rendered */
    readonly root: HTMLDivElement | null;
}

/** Internal props of FeedbackContent */
export interface FeedbackContentProps {
    type: FeedbackType;
    value: FeedbackValue | null;
    textAreaProps?: FeedbackTextAreaProps;
    radioGroupProps?: FeedbackRadioGroupProps;
    checkboxGroupProps?: FeedbackCheckboxGroupProps;
}

export interface FeedbackContentEmits {
    textChange: [value: string, event: TextAreaChangeEvent];
    reasonChange: [value: string, event: TextAreaChangeEvent];
    emojiChange: [emoji: string];
    radioChange: [event: RadioChangeEvent];
    checkboxChange: [value: CheckboxValue[]];
}

export type FeedbackContentSlots = Pick<FeedbackSlots, 'default' | 'radioLabel' | 'radioExtra' | 'checkboxLabel' | 'checkboxExtra'>;
