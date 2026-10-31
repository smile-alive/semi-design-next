import { createMemo, createUniqueId, For, type JSX, Match, Show, splitProps, Switch } from 'solid-js';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/feedback/constants';
import FeedbackFoundation, { type EmojiResult, type FeedbackAdapter, type FeedbackBaseState, type FeedbackValue, isFeedbackValueEmpty } from '@fibrae/semi-foundation/feedback/foundation';
import '@fibrae/semi-foundation/feedback/feedback.scss';
import callHandler from '../_base/call-handler';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import Button, { type ButtonProps } from '../button';
import CheckboxGroup, { type CheckboxGroupProps } from '../checkbox/checkbox-group';
import { TextArea, type TextAreaChangeEvent, type TextAreaProps } from '../input';
import useLocale from '../locale/use-locale';
import Modal, { type ModalProps } from '../modal';
import RadioGroup, { type RadioGroupProps } from '../radio/radio-group';
import SideSheet, { type SideSheetProps } from '../side-sheet';

const { Emoji } = strings;

const prefixCls = cssClasses.PREFIX;

type FeedbackCancelEvent = MouseEvent | KeyboardEvent;

export type FeedbackType = (typeof strings.TYPE)[number];

export interface BasicFeedbackProps {
    type?: FeedbackType;
    onValueChange?: (value: FeedbackValue) => void;
    /** `value` is Feedback's own; `onChange` is called after Feedback has handled the change */
    textAreaProps?: Omit<TextAreaProps, 'value'>;
    radioGroupProps?: Omit<RadioGroupProps, 'value'>;
    checkboxGroupProps?: Omit<CheckboxGroupProps, 'value'>;
    renderContent?: (content: JSX.Element) => JSX.Element;
}

export interface FeedbackModalProps extends ModalProps, BasicFeedbackProps {
    mode: 'modal';
}

export interface FeedbackSideSheetProps extends Omit<SideSheetProps, 'onCancel'>, BasicFeedbackProps {
    mode?: 'popup';
    /** A returned Promise keeps the button loading until it settles; any other return is ignored, such as a setter's */
    onOk?: (e: MouseEvent) => unknown;
    onCancel?: (e: MouseEvent | KeyboardEvent) => unknown;
    okButtonProps?: ButtonProps;
    cancelButtonProps?: ButtonProps;
    afterClose?: () => void;
}

export type FeedbackProps = FeedbackModalProps | FeedbackSideSheetProps;

// Both variants at once: which keys apply is decided by `mode` at run time
type AnyFeedbackProps = BasicFeedbackProps &
    Omit<FeedbackModalProps, 'mode' | 'onCancel' | 'onOk'> &
    Omit<FeedbackSideSheetProps, 'mode' | 'onCancel' | 'onOk' | 'okButtonProps' | 'cancelButtonProps'> & {
        mode?: 'modal' | 'popup';
        cancelButtonProps?: ButtonProps;
        onCancel?: FeedbackSideSheetProps['onCancel'];
        onOk?: FeedbackSideSheetProps['onOk'];
    };

type Foundation = FeedbackFoundation<FeedbackProps, FeedbackBaseState, FeedbackCancelEvent, MouseEvent, TextAreaChangeEvent>;
type Adapter = FeedbackAdapter<FeedbackProps, FeedbackBaseState, FeedbackCancelEvent, MouseEvent, TextAreaChangeEvent>;

const defaultProps = {
    mode: 'popup',
    type: 'emoji',
} satisfies Partial<FeedbackProps>;

export default function Feedback(rawProps: FeedbackProps) {
    const props = useDefaultProps('Feedback', rawProps, defaultProps) as AnyFeedbackProps;
    const [local, rest] = splitProps(props, ['afterClose', 'afterVisibleChange', 'cancelButtonProps', 'checkboxGroupProps', 'children', 'class', 'mode', 'okButtonProps', 'onCancel', 'onOk', 'onValueChange', 'radioGroupProps', 'renderContent', 'textAreaProps', 'type']);

    const locale = useLocale('Feedback');

    const emojiGroupName = createUniqueId();

    const { foundation, state } = useFoundation<Foundation, Adapter, FeedbackProps, FeedbackBaseState>(
        FeedbackFoundation,
        props as FeedbackProps,
        () => ({ value: null, onOKReturnPromiseStatus: 'fulfilled', onCancelReturnPromiseStatus: 'fulfilled' }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyValueChange: (value) => local.onValueChange?.(value),
            // the foundation tells a Promise apart from any other return
            notifyCancel: (e) => local.onCancel?.(e) as void | Promise<unknown>,
            notifyOk: (e) => local.onOk?.(e) as void | Promise<unknown>,
            notifyTextAreaChange: (value, e) => local.textAreaProps?.onChange?.(value, e),
            notifyCheckboxChange: (value) => local.checkboxGroupProps?.onChange?.(value),
            notifyRadioChange: (e) => local.radioGroupProps?.onChange?.(e),
        })
    );

    const emoji = createMemo(() => {
        const value = state().value as EmojiResult | null;
        return value !== null && typeof value === 'object' ? value.emoji : undefined;
    });

    // mergeProps ignores an `undefined` written after a spread, so a consumer's `value` would show through while nothing is chosen
    const radioGroupRest = createMemo(() => omit((local.radioGroupProps ?? {}) as RadioGroupProps, ['value']));

    const disabledOkButton = () => isFeedbackValueEmpty(state().value);

    const textValue = () => {
        const value = state().value;
        return typeof value === 'string' ? value : '';
    };

    const radioValue = () => {
        const value = state().value;
        return typeof value === 'object' ? undefined : value;
    };

    const checkboxValue = () => {
        const value = state().value;
        return Array.isArray(value) ? value : [];
    };

    // a consumer's `onChange` is called by the foundation; the value and handlers written after the spreads keep a consumer's from replacing Feedback's
    const content = () => (
        <Switch>
            <Match when={local.type === 'custom'}>{local.children}</Match>
            <Match when={local.type === 'text'}>
                <TextArea placeholder={locale().locale.placeholder} {...local.textAreaProps} value={textValue()} onChange={foundation.handleTextChange} />
            </Match>
            <Match when={local.type === 'emoji'}>
                <div class={`${prefixCls}-emoji-container`} aria-label={locale().locale.rating} role="radiogroup">
                    <For each={Object.entries(Emoji)}>
                        {([name, item]) => (
                            <label class={clsx(`${prefixCls}-emoji-item`, { [`${prefixCls}-emoji-item-selected`]: item === emoji() })} data-value={item}>
                                <input name={emojiGroupName} type="radio" class={`${prefixCls}-emoji-input`} aria-label={locale().locale[name as keyof typeof Emoji]} checked={item === emoji()} value={item} onChange={() => foundation.handleEmojiChange(item)} />
                                <span class={`${prefixCls}-emoji-glyph`} aria-hidden="true">
                                    {item}
                                </span>
                            </label>
                        )}
                    </For>
                </div>
                <Show when={emoji() === Emoji.bad}>
                    <TextArea placeholder={locale().locale.placeholderOptional} {...local.textAreaProps} onChange={foundation.handleEmojiReasonChange} />
                </Show>
            </Match>
            <Match when={local.type === 'radio'}>
                <div class={`${prefixCls}-radio-container`}>
                    <RadioGroup direction="vertical" {...radioGroupRest()} value={radioValue()} onChange={foundation.handleRadioChange} />
                </div>
            </Match>
            <Match when={local.type === 'checkbox'}>
                <div class={`${prefixCls}-checkbox-container`}>
                    <CheckboxGroup direction="vertical" {...local.checkboxGroupProps} value={checkboxValue()} onChange={foundation.handleCheckboxChange} />
                </div>
            </Match>
        </Switch>
    );

    // called where the dialog reads its children, so the content lives and dies with the open dialog
    const body = () => (
        <Show keyed when={local.renderContent} fallback={content()}>
            {(render) => render(content())}
        </Show>
    );

    const rootClass = () => clsx(prefixCls, { [`${prefixCls}-${local.type}`]: local.type }, local.class);

    // a `disabled` the caller gives wins; custom content relies on it to gate submit
    const modalOkButtonProps = () => ({ ...local.okButtonProps, disabled: local.okButtonProps?.disabled ?? disabledOkButton() });

    const footerCancelButtonProps = () => local.cancelButtonProps;

    const footerOkButtonProps = () => local.okButtonProps;

    return (
        <Show
            when={local.mode === 'modal'}
            fallback={
                <SideSheet
                    class={rootClass()}
                    canVerticalSetWidth
                    disableScroll={false}
                    footer={
                        <div class={`${prefixCls}-footer`}>
                            <Button
                                type="primary"
                                {...footerCancelButtonProps()}
                                loading={state().onCancelReturnPromiseStatus === 'pending' || footerCancelButtonProps()?.loading}
                                onClick={(e) => {
                                    callHandler(footerCancelButtonProps()?.onClick, e);
                                    foundation.handleCancel(e);
                                }}
                            >
                                {locale().locale.cancel}
                            </Button>
                            <Button
                                type="primary"
                                theme="solid"
                                {...footerOkButtonProps()}
                                disabled={footerOkButtonProps()?.disabled ?? disabledOkButton()}
                                loading={state().onOKReturnPromiseStatus === 'pending' || footerOkButtonProps()?.loading}
                                onClick={(e) => {
                                    callHandler(footerOkButtonProps()?.onClick, e);
                                    foundation.handleSubmit(e);
                                }}
                            >
                                {locale().locale.submit}
                            </Button>
                        </div>
                    }
                    height="auto"
                    mask={false}
                    placement="bottom"
                    {...(rest as SideSheetProps)}
                    onCancel={foundation.handleCancel}
                    afterVisibleChange={(visible) => {
                        local.afterVisibleChange?.(visible);
                        if (!visible) {
                            local.afterClose?.();
                        }
                    }}
                >
                    {body()}
                </SideSheet>
            }
        >
            <Modal class={rootClass()} cancelText={locale().locale.cancel} okText={locale().locale.submit} {...(rest as ModalProps)} afterClose={local.afterClose} cancelButtonProps={local.cancelButtonProps} okButtonProps={modalOkButtonProps()} onCancel={foundation.handleModalCancel} onOk={foundation.handleModalOk}>
                {body()}
            </Modal>
        </Show>
    );
}
