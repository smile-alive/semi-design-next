<script setup lang="ts">
    import { computed, onActivated, onDeactivated, shallowRef, useAttrs, useId } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/components/user-guide/constants';
    import UserGuideFoundation, { type UserGuideAdapter, type UserGuideBaseState } from '@fibrae/semi-foundation/components/user-guide/foundation';
    import '@fibrae/semi-foundation/components/user-guide/user-guide.scss';
    import { semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation, useKeepAliveFoundation } from '../../base/index';
    import Button from '../button';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Modal from '../modal';
    import Popover from '../popover';
    import type { PopoverHandle } from '../popover/interface';
    import type { UserGuideButtonProps, UserGuideEmits, UserGuideProps, UserGuideSlots, UserGuideStepItem } from './interface';
    import StepNodes from './step-nodes.vue';
    import { anchorStyle, buttonBind, contentNodes } from './use-user-guide';

    type FoundationProps = UserGuideProps & { steps: UserGuideStepItem[] };
    type Foundation = UserGuideFoundation<FoundationProps>;
    type Adapter = UserGuideAdapter<FoundationProps>;

    // No root element takes the attrs: class and style go to the popover or modal, the rest is dropped (F11)
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<UserGuideProps>(), {
        current: semiGlobalDefault('UserGuide', 'current'),
        finishText: semiGlobalDefault('UserGuide', 'finishText'),
        // Function-typed props cannot take a factory default; the global default is read in getContainer.
        getPopupContainer: undefined,
        mask: () => semiDefault('UserGuide', 'mask', true),
        mode: () => semiDefault('UserGuide', 'mode', 'popup'),
        nextButtonProps: semiGlobalDefault('UserGuide', 'nextButtonProps'),
        position: () => semiDefault('UserGuide', 'position', 'bottom'),
        prevButtonProps: semiGlobalDefault('UserGuide', 'prevButtonProps'),
        showPrevButton: () => semiDefault('UserGuide', 'showPrevButton', true),
        showSkipButton: () => semiDefault('UserGuide', 'showSkipButton', true),
        spotlightPadding: semiGlobalDefault('UserGuide', 'spotlightPadding'),
        steps: () => semiDefault('UserGuide', 'steps', []),
        theme: () => semiDefault('UserGuide', 'theme', 'default'),
        visible: () => semiDefault('UserGuide', 'visible', false),
        zIndex: () => semiDefault('UserGuide', 'zIndex', numbers.DEFAULT_Z_INDEX),
    });

    const emit = defineEmits<UserGuideEmits>();
    const slots = defineSlots<UserGuideSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('UserGuide');

    let popover: PopoverHandle | null = null;

    // A deactivated KeepAlive subtree leaves the page: the foundation gives up its holds and measuring silently, and the
    // card closes until reactivation. Tooltip would not close a controlled card.
    const active = shallowRef(true);

    const prefix = cssClasses.PREFIX;
    const modalPrefix = cssClasses.PREFIX_MODAL;
    const popupPrefix = `${prefix}-popup-content`;
    const spotlightId = `${prefix}-spotlight-${useId()}`;
    const titleId = `${spotlightId}-title`;
    const getContainer = computed(() => props.getPopupContainer ?? readSemiDefault(semi, 'UserGuide', 'getPopupContainer'));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, UserGuideBaseState>(
        UserGuideFoundation,
        props,
        () => UserGuideFoundation.getInitialState(props),
        () => ({
            getPopup: () => popover?.getPopup(),
            notifyChange: (current) => {
                emit('update:current', current);
                emit('change', current);
            },
            notifyFinish: () => {
                emit('update:visible', false);
                emit('finish');
            },
            notifyNext: (current) => emit('next', current),
            notifyPrev: (current) => emit('prev', current),
            notifySkip: () => {
                emit('update:visible', false);
                emit('skip');
            },
        }),
        { props: { getPopupContainer: () => getContainer.value }, context: () => config.value }
    );

    const current = computed(() => UserGuideFoundation.deriveCurrent(props, state.value));
    const step = computed(() => props.steps[current.value]);
    const isFirst = computed(() => current.value === 0);
    const isLast = computed(() => current.value === props.steps.length - 1);
    const showMask = computed(() => step.value?.mask ?? props.mask);
    const primary = computed(() => (step.value?.theme ?? props.theme) === 'primary');

    // a function ref: inside the v-for below, a string ref would collect an array
    const setPopover = (instance: unknown) => {
        popover = instance as PopoverHandle | null;
    };

    const stepView = () => {
        const item = step.value as UserGuideStepItem;
        const args = { item, index: current.value };
        const title = contentNodes(slots.title, args);
        const description = contentNodes(slots.description, args);
        const cover = contentNodes(slots.cover, args);
        return {
            item,
            title,
            description,
            cover,
            hasTitle: title.length > 0 || Boolean(item.title),
            hasDescription: description.length > 0 || Boolean(item.description),
        };
    };

    const secondaryBind = (): UserGuideButtonProps => ({
        style: primary.value ? { backgroundColor: 'var(--semi-color-fill-2)' } : {},
        theme: primary.value ? 'solid' : 'light',
        type: primary.value ? 'primary' : 'tertiary',
    });

    const popupPrevBind = () => buttonBind(secondaryBind(), props.prevButtonProps, foundation.handlePrev);

    const popupNextBind = () => buttonBind(primary.value ? { type: 'primary', theme: 'borderless', style: { backgroundColor: 'var(--semi-color-white)' } } : { type: 'primary', theme: 'solid' }, props.nextButtonProps, foundation.handleNext);

    const modalPrevBind = () => buttonBind({ type: 'tertiary' }, props.prevButtonProps, foundation.handlePrev);

    const modalNextBind = () => buttonBind({ theme: 'solid' }, props.nextButtonProps, foundation.handleNext);

    useKeepAliveFoundation(foundation);

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });
</script>

<template>
    <template v-if="props.visible && step">
        <template v-for="(view, i) in [stepView()]" :key="i">
            <Modal
                v-if="props.mode === 'modal'"
                :aria-labelledby="view.hasTitle ? titleId : undefined"
                centered
                :class="[modalPrefix, $attrs.class, step.class]"
                :getPopupContainer="getContainer"
                :mask="showMask"
                :maskClosable="false"
                :onCancel="foundation.handleSkip"
                :style="$attrs.style as never"
                :styles="{ body: { padding: 0 } }"
                :visible="props.visible"
                :zIndex="props.zIndex"
            >
                <template #header />
                <template #footer />
                <template v-if="view.cover.length">
                    <div :class="`${modalPrefix}-cover`"><StepNodes :nodes="view.cover" /></div>
                    <div aria-hidden="true" :class="`${modalPrefix}-indicator`">
                        <span v-for="(_, i) in props.steps" :key="i" :class="[`${modalPrefix}-indicator-item`, { [`${modalPrefix}-indicator-item-active`]: i === current }]" :data-index="i" />
                    </div>
                    <span :class="`${modalPrefix}-progress`">{{ current + 1 }}/{{ props.steps.length }}</span>
                </template>
                <div v-if="view.hasTitle || view.hasDescription" :class="`${modalPrefix}-body`">
                    <div v-if="view.hasTitle" :id="titleId" :class="`${modalPrefix}-body-title`">
                        <StepNodes :fallback="view.item.title" :nodes="view.title" />
                    </div>
                    <div v-if="view.hasDescription" :class="`${modalPrefix}-body-description`">
                        <StepNodes :fallback="view.item.description" :nodes="view.description" />
                    </div>
                </div>
                <div :class="`${modalPrefix}-footer`">
                    <Button v-if="props.showSkipButton && !isLast" type="tertiary" @click="foundation.handleSkip">
                        {{ locale.locale.skip }}
                    </Button>
                    <Button v-if="props.showPrevButton && !isFirst" v-bind="modalPrevBind()">
                        <slot name="prevText">{{ locale.locale.prev }}</slot>
                    </Button>
                    <Button v-bind="modalNextBind()" autofocus>
                        <template v-if="isLast">{{ props.finishText || locale.locale.finish }}</template>
                        <slot v-else name="nextText">{{ locale.locale.next }}</slot>
                    </Button>
                </div>
            </Modal>
            <template v-else-if="props.mode === 'popup' && state.spotlightRect">
                <Popover
                    :key="`userGuide-popup-${current}`"
                    :ref="setPopover"
                    :ariaLabelledby="view.hasTitle ? titleId : undefined"
                    :class="[`${prefix}-popover`, $attrs.class, step.class]"
                    :position="step.position || props.position"
                    :showArrow="step.showArrow !== false"
                    :style="[
                        {
                            padding: 0,
                            backgroundColor: primary && 'var(--semi-color-primary)',
                        },
                        attrs.style,
                    ]"
                    trigger="custom"
                    :visible="props.visible && active"
                    @escKeyDown="foundation.handleSkip"
                >
                    <!-- tabindex: Tooltip would add 0, an invisible Tab stop -->
                    <div :style="anchorStyle(state.spotlightRect)" tabindex="-1" />
                    <template #content>
                        <div :class="[popupPrefix, { [`${popupPrefix}-primary`]: primary }]">
                            <div v-if="view.cover.length" :class="`${popupPrefix}-cover`">
                                <StepNodes :nodes="view.cover" />
                            </div>
                            <div :class="`${popupPrefix}-body`">
                                <div v-if="view.hasTitle" :id="titleId" :class="`${popupPrefix}-title`">
                                    <StepNodes :fallback="view.item.title" :nodes="view.title" />
                                </div>
                                <div v-if="view.hasDescription" :class="`${popupPrefix}-description`">
                                    <StepNodes :fallback="view.item.description" :nodes="view.description" />
                                </div>
                                <div :class="`${popupPrefix}-footer`">
                                    <div v-if="props.steps.length > 1" :class="`${popupPrefix}-indicator`">{{ current + 1 }}/{{ props.steps.length }}</div>
                                    <div :class="`${popupPrefix}-buttons`">
                                        <Button v-if="props.showSkipButton && !isLast" v-bind="secondaryBind()" @click="foundation.handleSkip">
                                            {{ locale.locale.skip }}
                                        </Button>
                                        <Button v-if="props.showPrevButton && !isFirst" v-bind="popupPrevBind()">
                                            <slot name="prevText">{{ locale.locale.prev }}</slot>
                                        </Button>
                                        <Button v-bind="popupNextBind()" autofocus>
                                            <template v-if="isLast">
                                                {{ props.finishText || locale.locale.finish }}
                                            </template>
                                            <slot v-else name="nextText">{{ locale.locale.next }}</slot>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Popover>
                <svg :class="`${prefix}-spotlight`" :style="{ zIndex: props.zIndex }">
                    <defs>
                        <mask :id="spotlightId">
                            <rect fill="white" height="100%" width="100%" />
                            <rect :class="`${prefix}-spotlight-rect`" fill="black" :height="state.spotlightRect.height" :rx="4" :width="state.spotlightRect.width" :x="state.spotlightRect.x" :y="state.spotlightRect.y" />
                        </mask>
                    </defs>
                    <template v-if="showMask">
                        <rect fill="var(--semi-color-overlay-bg)" height="100%" :mask="`url(#${spotlightId})`" width="100%" />
                        <rect :class="`${prefix}-spotlight-transparent-rect`" fill="transparent" :height="state.spotlightRect.y" width="100%" :x="0" :y="0" />
                        <rect :class="`${prefix}-spotlight-transparent-rect`" fill="transparent" :height="state.spotlightRect.height" :width="state.spotlightRect.x" :x="0" :y="state.spotlightRect.y" />
                        <rect :class="`${prefix}-spotlight-transparent-rect`" fill="transparent" :height="state.spotlightRect.height" :width="`calc(100% - ${state.spotlightRect.x + state.spotlightRect.width}px)`" :x="state.spotlightRect.x + state.spotlightRect.width" :y="state.spotlightRect.y" />
                        <rect :class="`${prefix}-spotlight-transparent-rect`" fill="transparent" :height="`calc(100% - ${state.spotlightRect.y + state.spotlightRect.height}px)`" width="100%" :y="state.spotlightRect.y + state.spotlightRect.height" />
                    </template>
                </svg>
            </template>
        </template>
    </template>
</template>
