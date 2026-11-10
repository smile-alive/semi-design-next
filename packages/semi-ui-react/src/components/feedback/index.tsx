import type React from 'react';
import { useId } from 'react';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/feedback/constants';
import FeedbackFoundation, { type FeedbackAdapter, type FeedbackBaseState, type FeedbackValue, isFeedbackValueEmpty } from '@fibrae/semi-foundation/components/feedback/foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/components/feedback/feedback.scss';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import Button, { type ButtonProps } from '../button';
import CheckboxGroup, { type CheckboxGroupProps } from '../checkbox/checkbox-group';
import TextArea, { type TextAreaProps, type TextAreaChangeEvent } from '../input/textarea';
import useLocale from '../locale/use-locale';
import Modal, { type ModalReactProps } from '../modal';
import RadioGroup, { type RadioGroupProps } from '../radio/radio-group';
import SideSheet, { type SideSheetReactProps } from '../side-sheet';

type Foundation = FeedbackFoundation<FeedbackProps, FeedbackCancelEvent, React.MouseEvent, TextAreaChangeEvent>;
type Adapter = FeedbackAdapter<FeedbackProps, FeedbackCancelEvent, React.MouseEvent, TextAreaChangeEvent>;

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

    const [foundation, state] = useFoundation<Foundation, Adapter, FeedbackProps, FeedbackBaseState>(
        FeedbackFoundation,
        props,
        () => FeedbackFoundation.getInitialState(),
        (base) => ({
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
    const shown = FeedbackFoundation.getContentValues(value);

    // Feedback's value and handlers come after the spreads: the foundation calls the user's onChange itself, and a stray `value` must not desync the UI from onValueChange
    if (type === 'custom') {
        content = children;
    } else if (type === 'text') {
        content = <TextArea placeholder={locale.placeholder} {...textAreaProps} value={shown.text} onChange={foundation.handleTextChange} />;
    } else if (type === 'emoji') {
        const { emoji } = shown;
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
                <RadioGroup direction="vertical" {...radioGroupProps} value={shown.radio} onChange={foundation.handleRadioChange} />
            </div>
        );
    } else if (type === 'checkbox') {
        content = (
            <div className={`${prefixCls}-checkbox-container`}>
                <CheckboxGroup direction="vertical" {...checkboxGroupProps} value={shown.checkbox} onChange={foundation.handleCheckboxChange} />
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
