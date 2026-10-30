<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/feedback/constants';
    import FeedbackFoundation, { type FeedbackAdapter, type FeedbackBaseState, isFeedbackValueEmpty } from '@fibrae/semi-foundation/feedback/foundation';
    import isPromise from '@fibrae/semi-foundation/utils/is-promise';
    import '@fibrae/semi-foundation/feedback/feedback.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import Button from '../button/button.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import Modal from '../modal/modal.svelte';
    import type { RadioChangeEvent } from '../radio/interface.js';
    import SideSheet from '../side-sheet/side-sheet.svelte';
    import FeedbackContent from './feedback-content.svelte';
    import type { FeedbackButtonProps, FeedbackProps } from './interface.js';

    type CancelEvent = MouseEvent | KeyboardEvent;
    type ButtonClickEvent = MouseEvent & { currentTarget: EventTarget & HTMLButtonElement };
    type TextAreaEvent = Parameters<NonNullable<NonNullable<FeedbackProps['textAreaProps']>['onChange']>>[1];
    type Foundation = FeedbackFoundation<object, FeedbackBaseState, CancelEvent, MouseEvent, TextAreaEvent>;
    type Adapter = FeedbackAdapter<object, FeedbackBaseState, CancelEvent, MouseEvent, TextAreaEvent>;

    const defaults = useDefaultProps('Feedback');

    // No fallback on `visible`: a bound `undefined` (form reset) would throw with one, and undefined means closed
    let {
        visible = $bindable(),
        afterClose = defaults('afterClose'),
        afterVisibleChange = defaults('afterVisibleChange'),
        cancelButtonProps = defaults('cancelButtonProps'),
        checkboxGroupProps = defaults('checkboxGroupProps'),
        mode = defaults('mode', 'popup'),
        okButtonProps = defaults('okButtonProps'),
        onCancel = defaults('onCancel'),
        onOk = defaults('onOk'),
        onValueChange = defaults('onValueChange'),
        radioGroupProps = defaults('radioGroupProps'),
        textAreaProps = defaults('textAreaProps'),
        title = defaults('title'),
        type = defaults('type', 'emoji'),
        children,
        checkboxExtra,
        checkboxLabel,
        closeIcon,
        content,
        footer,
        header,
        icon,
        modal,
        radioExtra,
        radioLabel,
        ...rest
    }: FeedbackProps = $props();

    const locale = useLocale('Feedback');

    let modalRef = $state.raw<ReturnType<typeof Modal> | null>(null);
    let sheetRef = $state.raw<ReturnType<typeof SideSheet> | null>(null);

    // Modal derives loading from the returned Promise, but a caller's `loading` would replace it; track both here.
    let okPending = $state(false);
    let cancelPending = $state(false);

    const prefix = cssClasses.PREFIX;
    const open = $derived(Boolean(visible ?? defaults('visible', false)));

    // A forwarded `undefined` would replace the preset values (okText, mask, placement) of the Modal or SideSheet.
    const passthrough = $derived(Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)));

    const closeAfter = (result: unknown) => {
        if (isPromise(result)) {
            (result as Promise<unknown>).then(
                () => {
                    visible = false;
                },
                // the foundation rethrows the rejection; only skip the close
                () => {}
            );
        } else {
            visible = false;
        }
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, object, FeedbackBaseState>(
        FeedbackFoundation,
        {},
        () => ({ value: null, onOKReturnPromiseStatus: 'fulfilled', onCancelReturnPromiseStatus: 'fulfilled' }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyValueChange: (value) => onValueChange?.(value),
            notifyCancel: (event) => {
                const result = onCancel?.(event);
                closeAfter(result);
                return result as void | Promise<unknown>;
            },
            notifyOk: (event) => onOk?.(event) as void | Promise<unknown>,
            notifyTextAreaChange: (value, event) => textAreaProps?.onChange?.(value, event),
            notifyCheckboxChange: (value) => checkboxGroupProps?.onChange?.(value),
            notifyRadioChange: (event) => radioGroupProps?.onChange?.(event as RadioChangeEvent),
        })
    );

    const disabledOkButton = $derived(isFeedbackValueEmpty(states().value));

    const buttonProps = (kind: 'ok' | 'cancel'): FeedbackButtonProps => {
        const popup = mode === 'popup';
        const custom = kind === 'ok' ? okButtonProps : cancelButtonProps;
        const popupPending = (kind === 'ok' ? states().onOKReturnPromiseStatus : states().onCancelReturnPromiseStatus) === 'pending';
        const pending = popup ? popupPending : kind === 'ok' ? okPending : cancelPending;
        return {
            ...custom,
            ...(kind === 'ok' && { disabled: custom?.disabled ?? disabledOkButton }),
            ...((popup || custom?.loading !== undefined) && { loading: Boolean(custom?.loading) || pending }),
        };
    };

    const modalOkProps = $derived(buttonProps('ok'));
    const modalCancelProps = $derived(cancelButtonProps ? buttonProps('cancel') : undefined);

    // SideSheet focuses the first [autofocus] element, so autoFocus becomes the native attribute.
    const popupButton = (kind: 'ok' | 'cancel') => {
        const { autoFocus, onclick, ...own } = buttonProps(kind);
        return {
            ...own,
            ...(autoFocus && { autofocus: true }),
            onclick: (event: ButtonClickEvent) => {
                onclick?.(event);
                if (kind === 'ok') {
                    foundation.handleSubmit(event);
                } else {
                    foundation.handleCancel(event);
                }
            },
        };
    };

    const track = (result: unknown, setPending: (pending: boolean) => void) => {
        if (isPromise(result)) {
            setPending(true);
            const done = () => setPending(false);
            (result as Promise<unknown>).then(done, done);
        }
    };

    // the foundation returns null for a non-Promise, which Modal does not accept
    const modalOk = (event: MouseEvent) => {
        const result = foundation.handleModalOk(event);
        track(result, (pending) => (okPending = pending));
        return result ?? undefined;
    };

    const modalCancel = (event: CancelEvent) => {
        const result = foundation.handleModalCancel(event);
        track(result, (pending) => (cancelPending = pending));
        return result ?? undefined;
    };

    const onAfterVisibleChange = (isVisible: boolean) => {
        afterVisibleChange?.(isVisible);
        if (!isVisible) {
            afterClose?.();
        }
    };

    /** The outer element of the Modal or SideSheet inside the portal; null while nothing is rendered */
    export function getRoot() {
        return (mode === 'modal' ? modalRef : sheetRef)?.getRoot() ?? null;
    }
</script>

{#snippet builtin()}
    <FeedbackContent
        {checkboxExtra}
        {checkboxGroupProps}
        {checkboxLabel}
        {children}
        onCheckboxChange={foundation.handleCheckboxChange}
        onEmojiChange={foundation.handleEmojiChange}
        onRadioChange={foundation.handleRadioChange}
        onReasonChange={foundation.handleEmojiReasonChange}
        onTextChange={foundation.handleTextChange}
        {radioExtra}
        {radioGroupProps}
        {radioLabel}
        {textAreaProps}
        {type}
        value={states().value}
    />
{/snippet}

{#snippet body()}
    {#if content}
        {@render content({ content: builtin })}
    {:else}
        {@render builtin()}
    {/if}
{/snippet}

{#snippet popupFooter()}
    <div class={`${prefix}-footer`}>
        <Button type="primary" {...popupButton('cancel')}>{locale().locale.cancel}</Button>
        <Button theme="solid" type="primary" {...popupButton('ok')}>{locale().locale.submit}</Button>
    </div>
{/snippet}

{#if mode === 'modal'}
    <!-- the setter is ignored: the close follows onCancel, and waits for the Promise it may return -->
    <Modal
        bind:this={modalRef}
        cancelText={locale().locale.cancel}
        okText={locale().locale.submit}
        {...passthrough}
        {afterClose}
        bind:visible={() => open, () => {}}
        cancelButtonProps={modalCancelProps}
        children={body}
        class={[prefix, `${prefix}-${type}`, rest.class]}
        {closeIcon}
        {footer}
        {header}
        {icon}
        {modal}
        okButtonProps={modalOkProps}
        onCancel={modalCancel}
        onOk={modalOk}
        {title}
    />
{:else}
    <SideSheet
        bind:this={sheetRef}
        canVerticalSetWidth
        disableScroll={false}
        height="auto"
        mask={false}
        placement="bottom"
        {...passthrough}
        afterVisibleChange={onAfterVisibleChange}
        bind:visible={() => open, () => {}}
        children={body}
        class={[prefix, `${prefix}-${type}`, rest.class]}
        {closeIcon}
        footer={footer === undefined ? popupFooter : (footer ?? undefined)}
        onCancel={foundation.handleCancel}
        {title}
    />
{/if}
