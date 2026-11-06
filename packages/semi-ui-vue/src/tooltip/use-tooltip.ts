import { type ComputedRef, type ShallowRef, computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, shallowRef, useId, watch, watchEffect } from 'vue';
import { COLOR_SCHEME_SELECTOR, colorSchemeOf, cssClasses, popupTarget } from '@fibrae/semi-foundation/tooltip/constants';
import TooltipFoundation, { type TooltipAdapter, type TooltipBaseState } from '@fibrae/semi-foundation/tooltip/foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import useEventListener, { getWindow } from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
import useConfig from '../config-provider/use-config';
import { provideTooltipPopupsContext, useTooltipPopupsContext } from './context';
import type { FocusTarget, RenderContentProps, TooltipEmits, TooltipHandle, TooltipProps } from './interface';

type Foundation = TooltipFoundation<TooltipProps>;
type Adapter = TooltipAdapter<TooltipProps>;
type Emit = <K extends keyof TooltipEmits>(name: K, ...args: TooltipEmits[K]) => void;

interface TooltipRuntime {
    foundation: Foundation;
    state: Readonly<ShallowRef<TooltipBaseState>>;
    context: ReturnType<typeof useConfig>;
    popupId: ComputedRef<string>;
    contentShown: ShallowRef<boolean>;
    /** False while KeepAlive keeps the component cached away */
    active: Readonly<ShallowRef<boolean>>;
    contentSlotProps: RenderContentProps;
    setTriggerElement: (element: Element | null) => void;
    handle: TooltipHandle;
}

interface PopupRegistryHandle {
    descendants: Set<() => HTMLElement | null>;
    relayFocus: (event: FocusEvent) => void;
}

// Teleported nodes do not bubble through Vue ancestors like React portals: every ancestor tracks all descendant
// containers, and focus changes inside a descendant popup are handed upwards.
function usePopupRegistry(container: () => HTMLElement | null, trigger: () => Element | null, onPortalFocus: (event: FocusEvent) => void): PopupRegistryHandle {
    const parent = useTooltipPopupsContext();

    const descendants = new Set<() => HTMLElement | null>();

    const unregister = parent?.register(container);

    const relayFocus = (event: FocusEvent) => parent?.relayFocus(event, trigger());

    provideTooltipPopupsContext({
        register: (child) => {
            descendants.add(child);
            const unregisterParent = parent?.register(child);
            return () => {
                descendants.delete(child);
                unregisterParent?.();
            };
        },
        // React's bubbling reaches this popup only from a Tooltip rendered in its content, not from one in the trigger.
        relayFocus: (event, from) => {
            if (from && container()?.contains(from)) {
                onPortalFocus(event);
                relayFocus(event);
            }
        },
    });

    onBeforeUnmount(() => unregister?.());

    return { descendants, relayFocus };
}

export default function useTooltip(props: TooltipProps, emit: Emit, container: Readonly<ShallowRef<HTMLDivElement | null>>): TooltipRuntime {
    const context = useConfig();

    const generatedId = useId();
    const triggerElement = shallowRef<Element | null>(null);
    const contentShown = shallowRef(false);
    const initialFocusRef = shallowRef<FocusTarget | null>(null);
    const onClickOutside = shallowRef<((event: MouseEvent) => void) | null>(null);

    // KeepAlive leaves the teleported popup on the page when the trigger is cached away; an open popup keeps its state,
    // so tooltip.vue disables the Teleport, which moves the popup into the cached subtree, out of the document.
    const active = shallowRef(true);

    const popupId = computed(() => props.wrapperId || `${cssClasses.PREFIX}-${generatedId}`);

    const { descendants, relayFocus } = usePopupRegistry(
        () => container.value,
        () => triggerElement.value,
        (event) => state.value.portalEventSet[event.type]?.(event)
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, TooltipProps, TooltipBaseState>(
        TooltipFoundation,
        props,
        () => TooltipFoundation.getInitialState(),
        (base) => {
            const adapter: Omit<Adapter, keyof typeof base> = {
                insertPortal: () => {
                    const first = triggerElement.value;
                    return {
                        portalTarget: popupTarget(first?.getRootNode(), (fullscreen) => Boolean(first && fullscreen.contains(first))),
                        colorScheme: colorSchemeOf(first?.closest(COLOR_SCHEME_SELECTOR)),
                    };
                },
                removePortal: () => {
                    contentShown.value = false;
                },
                showPopover: () => {
                    if (!container.value?.matches(':popover-open')) {
                        container.value?.showPopover();
                    }
                },
                hidePopover: () => container.value?.hidePopover(),
                waitAnimations: () => {
                    const animations = container.value?.getAnimations() ?? [];
                    return animations.length ? Promise.allSettled(animations.map((animation) => animation.finished)) : null;
                },
                notifyAfterOpen: () => emit('afterOpen'),
                notifyAfterClose: () => emit('afterClose'),
                notifyVisibleChange: (visible) => {
                    emit('update:visible', visible);
                    emit('visibleChange', visible);
                },
                registerClickOutsideHandler: (handler) => {
                    onClickOutside.value = handler;
                },
                unregisterClickOutsideHandler: () => {
                    onClickOutside.value = null;
                },
                isEventInTrigger: (event) => isEventInside(event, triggerElement.value),
                isEventInPopup: (event) => isEventInside(event, container.value, ...[...descendants].map((get) => get())),
                notifyClickOutSide: (event) => emit('clickOutSide', event),
                getPortalContainer: () => container.value,
                getTriggerNode: () => triggerElement.value,
                getTriggerRect: () => triggerElement.value?.getBoundingClientRect() ?? null,
                getTriggerElement: () => triggerElement.value ?? null,
                observeTrigger: (observer) => {
                    if (triggerElement.value) observer.observe(triggerElement.value);
                },
                unobserveTrigger: (observer) => {
                    if (triggerElement.value) observer.unobserve(triggerElement.value);
                },
                isTriggerHovered: () => [triggerElement.value, ...[...descendants].map((get) => get())].some((element) => element?.isConnected && element.matches(':hover')),
                setInitialFocus: () => initialFocusRef.value?.focus({ preventScroll: props.preventScroll }),
                notifyOpen: () => emit('open'),
                notifyEscKeydown: (event) => emit('escKeyDown', event),
                getPopupId: () => popupId.value,
            };
            return adapter;
        },
        { context: () => context.value }
    );

    const contentSlotProps = { initialFocusRef };
    const isOpen = computed(() => state.value.isInsert && state.value.transitionState !== 'leave');

    const handle: TooltipHandle = {
        focusTrigger: foundation.focusTrigger,
        getPopupId: () => popupId.value,
        getPopup: () => container.value,
        hide: foundation.hide,
        rePosition: foundation.calcPosition,
    };

    const setTriggerElement = (element: Element | null) => {
        if (element !== triggerElement.value) {
            triggerElement.value = element;
        }
    };

    useEventListener(
        getWindow,
        'mousedown',
        // the listener is removed after a flush; a close earlier in the same task has already cleared the handler
        (event) => onClickOutside.value?.(event),
        { enabled: () => onClickOutside.value !== null }
    );

    watchEffect(
        (cleanup) => {
            const element = triggerElement.value;
            if (!element) {
                return;
            }
            const controller = new AbortController();
            for (const [name, handler] of Object.entries(state.value.triggerEventSet)) {
                // keydown is bound through the trigger's attributes so it runs before the trigger's own handler.
                if (name !== 'keydown') {
                    element.addEventListener(name, handler, { signal: controller.signal });
                }
            }
            cleanup(() => controller.abort());
        },
        { flush: 'sync' }
    );

    watchEffect(
        (cleanup) => {
            const element = container.value;
            if (!element) {
                return;
            }
            const controller = new AbortController();
            for (const [name, handler] of Object.entries(state.value.portalEventSet)) {
                element.addEventListener(name, handler, { signal: controller.signal });
            }
            element.addEventListener('focusin', relayFocus, { signal: controller.signal });
            element.addEventListener('focusout', relayFocus, { signal: controller.signal });
            cleanup(() => controller.abort());
        },
        { flush: 'post' }
    );

    // Separate sources: compared one by one, so it runs once per change, not on every state write. showPopover() throws
    // on a popup cached out of the document, and the browser hides one taken out of it without showing it again when
    // it is moved back, so it is synced on every activation
    watch(
        [() => state.value.isInsert, () => state.value.transitionState, container, active],
        ([, , , isActive]) => {
            if (isActive) {
                foundation.syncPopup();
            }
        },
        { flush: 'post' }
    );

    watchEffect(
        async () => {
            if (isOpen.value && contentShown.value && props.role === 'dialog') {
                // contentShown turns true inside showPopover(), in this same post flush and before the content renders,
                // and the name may point into the content
                await nextTick();
                warnIfDialogUnnamed(container.value, 'Popover');
            }
        },
        { flush: 'post' }
    );

    // Vue drops emits after unmount, so the final close is reported in beforeUnmount
    onBeforeUnmount(foundation.handleUnmount);

    useKeepAliveFoundation(foundation);

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    return {
        foundation,
        state,
        context,
        popupId,
        contentShown,
        active,
        contentSlotProps,
        setTriggerElement,
        handle,
    };
}
