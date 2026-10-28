<script setup lang="ts">
    import { computed, h, shallowRef, useAttrs, useTemplateRef, type ShallowRef } from 'vue';
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/feedback/constants';
    import FeedbackFoundation, { isFeedbackValueEmpty, type FeedbackAdapter, type FeedbackBaseState } from '@fibrae/semi-foundation/feedback/foundation';
    import isPromise from '@fibrae/semi-foundation/utils/is-promise';
    import '@fibrae/semi-foundation/feedback/feedback.scss';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Button from '../button';
    import useLocale from '../locale/use-locale';
    import Modal from '../modal';
    import type { RadioChangeEvent } from '../radio/interface';
    import SideSheet from '../side-sheet';
    import FeedbackContent from './feedback-content.vue';
    import type { FeedbackButtonProps, FeedbackEmits, FeedbackHandle, FeedbackProps, FeedbackSlots, FeedbackTextAreaProps } from './interface';

    type CancelEvent = MouseEvent | KeyboardEvent;
    type TextAreaEvent = Parameters<NonNullable<FeedbackTextAreaProps['onChange']>>[1];
    type Foundation = FeedbackFoundation<FeedbackProps, FeedbackBaseState, CancelEvent, MouseEvent, TextAreaEvent>;
    type Adapter = FeedbackAdapter<FeedbackProps, FeedbackBaseState, CancelEvent, MouseEvent, TextAreaEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<FeedbackProps>(), {
        mode: () => semiDefault('Feedback', 'mode', 'popup'),
        type: () => semiDefault('Feedback', 'type', 'emoji'),
        visible: () => semiDefault('Feedback', 'visible', false),
        title: semiGlobalDefault('Feedback', 'title'),
        textAreaProps: semiGlobalDefault('Feedback', 'textAreaProps'),
        radioGroupProps: semiGlobalDefault('Feedback', 'radioGroupProps'),
        checkboxGroupProps: semiGlobalDefault('Feedback', 'checkboxGroupProps'),
        okButtonProps: semiGlobalDefault('Feedback', 'okButtonProps'),
        cancelButtonProps: semiGlobalDefault('Feedback', 'cancelButtonProps'),
        onOk: undefined,
        onCancel: undefined,
    });

    const emit = defineEmits<FeedbackEmits>();
    const slots = defineSlots<FeedbackSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('Feedback');

    const modal = useTemplateRef('modal');
    const sheet = useTemplateRef('sheet');

    // Modal derives loading from the returned Promise, but a caller's `loading` would replace it; track both here.
    const okPending = shallowRef(false);
    const cancelPending = shallowRef(false);

    const prefix = cssClasses.PREFIX;
    const okFn = computed(() => props.onOk ?? readSemiDefault(semi, 'Feedback', 'onOk'));
    const cancelFn = computed(() => props.onCancel ?? readSemiDefault(semi, 'Feedback', 'onCancel'));

    // A forwarded `undefined` attr would replace the preset values (okText, mask, placement) on Modal or SideSheet, so
    // attrs are bound by hand with the undefined ones dropped.
    const definedAttrs = () => omitBy(attrs, (value) => value === undefined);

    const closeAfter = (result: unknown) => {
        if (isPromise(result)) {
            (result as Promise<unknown>).then(
                () => emit('update:visible', false),
                // the foundation rethrows the rejection; only skip the close
                () => {}
            );
        } else {
            emit('update:visible', false);
        }
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, FeedbackProps, FeedbackBaseState>(
        FeedbackFoundation,
        props,
        () => ({ value: null, onOKReturnPromiseStatus: 'fulfilled', onCancelReturnPromiseStatus: 'fulfilled' }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyValueChange: (value) => emit('valueChange', value),
            notifyCancel: (event) => {
                const result = cancelFn.value?.(event);
                closeAfter(result);
                return result;
            },
            notifyOk: (event) => okFn.value?.(event),
            notifyTextAreaChange: (value, event) => props.textAreaProps?.onChange?.(value, event),
            notifyCheckboxChange: (value) => props.checkboxGroupProps?.onChange?.(value),
            notifyRadioChange: (event) => props.radioGroupProps?.onChange?.(event as RadioChangeEvent),
        })
    );

    const disabledOkButton = computed(() => isFeedbackValueEmpty(state.value.value));

    const track = (result: unknown, pending: ShallowRef<boolean>) => {
        if (isPromise(result)) {
            pending.value = true;
            const done = () => {
                pending.value = false;
            };
            (result as Promise<unknown>).then(done, done);
        }
    };

    // the foundation returns null for a non-Promise, which Modal does not accept
    const modalOk = (event: MouseEvent) => {
        const result = foundation.handleModalOk(event);
        track(result, okPending);
        return result ?? undefined;
    };

    const modalCancel = (event: CancelEvent) => {
        const result = foundation.handleModalCancel(event);
        track(result, cancelPending);
        return result ?? undefined;
    };

    const buttonProps = (kind: 'ok' | 'cancel'): FeedbackButtonProps => {
        const popup = props.mode === 'popup';
        const custom = kind === 'ok' ? props.okButtonProps : props.cancelButtonProps;
        const pending = popup ? (kind === 'ok' ? state.value.onOKReturnPromiseStatus : state.value.onCancelReturnPromiseStatus) === 'pending' : (kind === 'ok' ? okPending : cancelPending).value;
        return {
            ...custom,
            ...(kind === 'ok' && { disabled: custom?.disabled ?? disabledOkButton.value }),
            ...((popup || custom?.loading !== undefined) && { loading: Boolean(custom?.loading) || pending }),
        };
    };

    const modalOkProps = computed(() => buttonProps('ok'));
    const modalCancelProps = computed(() => (props.cancelButtonProps ? buttonProps('cancel') : undefined));

    // SideSheet focuses the first [autofocus] element, so autoFocus becomes the native attribute.
    const popupButton = (kind: 'ok' | 'cancel') => {
        const { autoFocus, ...rest } = buttonProps(kind);
        return autoFocus ? { ...rest, autofocus: true } : rest;
    };

    const onAfterVisibleChange = (visible: boolean) => {
        emit('afterVisibleChange', visible);
        if (!visible) emit('afterClose');
    };

    const contentNode = () =>
        h(
            FeedbackContent,
            {
                type: props.type,
                value: state.value.value,
                textAreaProps: props.textAreaProps,
                radioGroupProps: props.radioGroupProps,
                checkboxGroupProps: props.checkboxGroupProps,
                onTextChange: (value: string, event: TextAreaEvent) => foundation.handleTextChange(value, event),
                onReasonChange: (value: string, event: TextAreaEvent) => foundation.handleEmojiReasonChange(value, event),
                onEmojiChange: (emoji: string) => foundation.handleEmojiChange(emoji),
                onRadioChange: (event: Parameters<typeof foundation.handleRadioChange>[0]) => foundation.handleRadioChange(event),
                onCheckboxChange: (value: Parameters<typeof foundation.handleCheckboxChange>[0]) => foundation.handleCheckboxChange(value),
            },
            { ...slots }
        );

    defineExpose<FeedbackHandle>({
        get root() {
            return (props.mode === 'modal' ? modal.value?.root : sheet.value?.root) ?? null;
        },
    });
</script>

<template>
    <Modal
        v-if="props.mode === 'modal'"
        ref="modal"
        :cancelButtonProps="modalCancelProps"
        :cancelText="locale.locale.cancel"
        :class="[prefix, `${prefix}-${props.type}`]"
        :okButtonProps="modalOkProps"
        :okText="locale.locale.submit"
        :onCancel="modalCancel"
        :onOk="modalOk"
        :title="props.title"
        :visible="props.visible"
        v-bind="definedAttrs()"
        @afterClose="emit('afterClose')"
    >
        <!-- forwarded only when given: a given #footer or #modal replaces Modal's buttons or dialog, a given #header renders
             even when empty, and a given #title replaces the title prop -->
        <template v-if="$slots.title" #title>
            <slot name="title" />
        </template>
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>
        <template v-if="$slots.footer" #footer>
            <slot name="footer" />
        </template>
        <template v-if="$slots.icon" #icon>
            <slot name="icon" />
        </template>
        <template v-if="$slots.closeIcon" #closeIcon>
            <slot name="closeIcon" />
        </template>
        <template v-if="$slots.modal" #modal="slotProps">
            <slot name="modal" v-bind="slotProps" />
        </template>
        <slot v-if="$slots.content" :content="contentNode()" name="content" />
        <component :is="contentNode()" v-else />
    </Modal>
    <SideSheet
        v-else
        ref="sheet"
        canVerticalSetWidth
        :class="[prefix, `${prefix}-${props.type}`]"
        :disableScroll="false"
        height="auto"
        :mask="false"
        placement="bottom"
        :title="props.title"
        :visible="props.visible"
        v-bind="definedAttrs()"
        @afterVisibleChange="onAfterVisibleChange"
        @cancel="foundation.handleCancel($event)"
    >
        <!-- forwarded only when given: a given #title replaces SideSheet's title prop -->
        <template v-if="$slots.title" #title>
            <slot name="title" />
        </template>
        <template v-if="$slots.closeIcon" #closeIcon>
            <slot name="closeIcon" />
        </template>
        <template #footer>
            <slot v-if="$slots.footer" name="footer" />
            <div v-else :class="`${prefix}-footer`">
                <Button type="primary" v-bind="popupButton('cancel')" @click="foundation.handleCancel($event)">
                    {{ locale.locale.cancel }}
                </Button>
                <Button theme="solid" type="primary" v-bind="popupButton('ok')" @click="foundation.handleSubmit($event)">
                    {{ locale.locale.submit }}
                </Button>
            </div>
        </template>
        <slot v-if="$slots.content" :content="contentNode()" name="content" />
        <component :is="contentNode()" v-else />
    </SideSheet>
</template>
