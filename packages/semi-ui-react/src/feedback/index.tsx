import type React from 'react';
import { useId } from 'react';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/feedback/constants';
import FeedbackFoundation, { type FeedbackAdapter, type EmojiResult, type FeedbackBaseState, type FeedbackValue, isFeedbackValueEmpty } from '@fibrae/semi-foundation/feedback/foundation';
import '@fibrae/semi-foundation/feedback/feedback.scss';
import type { ArrayElement } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import Button, { type ButtonProps } from '../button';
import CheckboxGroup, { type CheckboxGroupProps } from '../checkbox/checkbox-group';
import TextArea, { type TextAreaProps, type TextAreaChangeEvent } from '../input/textarea';
import useLocale from '../locale/use-locale';
import Modal, { type ModalReactProps } from '../modal';
import RadioGroup, { type RadioGroupProps } from '../radio/radio-group';
import SideSheet, { type SideSheetReactProps } from '../side-sheet';

const { Emoji } = strings;

const prefixCls = cssClasses.PREFIX;

type FeedbackCancelEvent = React.MouseEvent | KeyboardEvent;

export interface BasicFeedbackProps {
    type?: ArrayElement<typeof strings.TYPE>;
    onValueChange?: (value: FeedbackValue) => void;
    /** `value` is Feedback's own; `onChange` is called after Feedback has handled the change */
    textAreaProps?: Omit<TextAreaProps, 'value'>;
    radioGroupProps?: Omit<RadioGroupProps, 'value'>;
    checkboxGroupProps?: Omit<CheckboxGroupProps, 'value'>;
    renderContent?: (content: React.ReactNode) => React.ReactNode;
    /** Attached to the Modal or SideSheet wrapper div inside the portal; null while nothing is rendered */
    ref?: React.Ref<HTMLDivElement>;
}

export interface FeedbackModalProps extends ModalReactProps, BasicFeedbackProps {
    mode: 'modal';
}

export interface FeedbackSideSheetProps extends Omit<SideSheetReactProps, 'onCancel'>, BasicFeedbackProps {
    mode?: 'popup';
    onOk?: (e: React.MouseEvent) => void | Promise<any>;
    onCancel?: (e: React.MouseEvent | KeyboardEvent) => void | Promise<any>;
    okButtonProps?: ButtonProps;
    cancelButtonProps?: ButtonProps;
    afterClose?: () => void;
}

export type FeedbackProps = FeedbackModalProps | FeedbackSideSheetProps;

const defaultProps = {
    mode: 'popup',
    type: 'emoji',
} satisfies Partial<FeedbackProps>;

export default function Feedback(rawProps: FeedbackProps): React.ReactNode {
    const props = useDefaultProps('Feedback', rawProps, defaultProps);
    const { className, children, type, mode, onValueChange, textAreaProps, radioGroupProps, checkboxGroupProps, renderContent, onCancel, onOk, ...restProps } = props;

    const { locale } = useLocale('Feedback');

    const emojiGroupName = useId();
    let content: React.ReactNode = null;

    const [foundation, state] = useFoundation<FeedbackFoundation<FeedbackProps, FeedbackBaseState, FeedbackCancelEvent, React.MouseEvent, TextAreaChangeEvent>, FeedbackAdapter<FeedbackProps, FeedbackBaseState, FeedbackCancelEvent, React.MouseEvent, TextAreaChangeEvent>, FeedbackProps, FeedbackBaseState>(
        FeedbackFoundation,
        props,
        () => ({ value: null, onOKReturnPromiseStatus: 'fulfilled', onCancelReturnPromiseStatus: 'fulfilled' }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyValueChange: (value) => base.getProps().onValueChange?.(value),
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyOk: (e) => base.getProps().onOk?.(e),
            notifyTextAreaChange: (value, e) => base.getProps().textAreaProps?.onChange?.(value, e),
            notifyCheckboxChange: (value) => base.getProps().checkboxGroupProps?.onChange?.(value),
            notifyRadioChange: (e) => base.getProps().radioGroupProps?.onChange?.(e),
        })
    );

    // a forwarded `undefined` must not replace the preset values spread before `rest`
    const rest = omitBy(restProps, (value) => value === undefined);
    const { value, onOKReturnPromiseStatus, onCancelReturnPromiseStatus } = state;
    const disabledOkButton = isFeedbackValueEmpty(value);

    // Feedback's value and handlers come after the spreads: the foundation calls the user's onChange itself, and a stray `value` must not desync the UI from onValueChange
    if (type === 'custom') {
        content = children;
    } else if (type === 'text') {
        content = <TextArea placeholder={locale.placeholder} {...textAreaProps} value={typeof value === 'string' ? value : ''} onChange={foundation.handleTextChange} />;
    } else if (type === 'emoji') {
        const { emoji } = (value ?? {}) as EmojiResult;
        content = (
            <>
                <div className={`${prefixCls}-emoji-container`} aria-label={locale.rating} role="radiogroup">
                    {Object.entries(Emoji).map(([name, item]) => (
                        <label
                            key={item}
                            className={clsx(`${prefixCls}-emoji-item`, {
                                [`${prefixCls}-emoji-item-selected`]: item === emoji,
                            })}
                            data-value={item}
                        >
                            <input name={emojiGroupName} type="radio" className={`${prefixCls}-emoji-input`} aria-label={locale[name as keyof typeof Emoji]} checked={item === emoji} value={item} onChange={() => foundation.handleEmojiChange(item)} />
                            <span className={`${prefixCls}-emoji-glyph`} aria-hidden>
                                {item}
                            </span>
                        </label>
                    ))}
                </div>
                {emoji === Emoji.bad && <TextArea placeholder={locale.placeholderOptional} {...textAreaProps} onChange={foundation.handleEmojiReasonChange} />}
            </>
        );
    } else if (type === 'radio') {
        content = (
            <div className={`${prefixCls}-radio-container`}>
                <RadioGroup direction="vertical" {...radioGroupProps} value={typeof value === 'object' ? undefined : value} onChange={foundation.handleRadioChange} />
            </div>
        );
    } else if (type === 'checkbox') {
        content = (
            <div className={`${prefixCls}-checkbox-container`}>
                <CheckboxGroup direction="vertical" {...checkboxGroupProps} value={Array.isArray(value) ? value : []} onChange={foundation.handleCheckboxChange} />
            </div>
        );
    }

    if (typeof renderContent === 'function') {
        content = renderContent(content);
    }

    const realCls = clsx(prefixCls, { [`${prefixCls}-${type}`]: type }, className);

    if (mode === 'modal') {
        const { okButtonProps: modalOkButtonProps, ...modalRest } = rest;
        return (
            <Modal
                className={realCls}
                cancelText={locale.cancel}
                // a disabled the caller gives wins; custom content relies on it to gate submit
                okButtonProps={{ ...modalOkButtonProps, disabled: modalOkButtonProps?.disabled ?? disabledOkButton }}
                okText={locale.submit}
                {...modalRest}
                onCancel={foundation.handleModalCancel}
                onOk={foundation.handleModalOk}
            >
                {content}
            </Modal>
        );
    }

    // SideSheet has no afterClose and passes unknown props to its root DOM; it reports hiding via afterVisibleChange
    const { okButtonProps, cancelButtonProps, afterClose, afterVisibleChange, ...sideSheetRest } = rest as Omit<FeedbackSideSheetProps, 'onCancel'>;

    return (
        <SideSheet
            className={realCls}
            canVerticalSetWidth
            disableScroll={false}
            footer={
                <div className={`${prefixCls}-footer`}>
                    <Button
                        type="primary"
                        {...cancelButtonProps}
                        loading={onCancelReturnPromiseStatus === 'pending' || cancelButtonProps?.loading}
                        onClick={(e) => {
                            cancelButtonProps?.onClick?.(e);
                            foundation.handleCancel(e);
                        }}
                    >
                        {locale.cancel}
                    </Button>
                    <Button
                        type="primary"
                        theme="solid"
                        {...okButtonProps}
                        disabled={okButtonProps?.disabled ?? disabledOkButton}
                        loading={onOKReturnPromiseStatus === 'pending' || okButtonProps?.loading}
                        onClick={(e) => {
                            okButtonProps?.onClick?.(e);
                            foundation.handleSubmit(e);
                        }}
                    >
                        {locale.submit}
                    </Button>
                </div>
            }
            height="auto"
            mask={false}
            placement="bottom"
            onCancel={foundation.handleCancel}
            {...sideSheetRest}
            afterVisibleChange={(visible) => {
                afterVisibleChange?.(visible);
                if (!visible) {
                    afterClose?.();
                }
            }}
        >
            {content}
        </SideSheet>
    );
}
