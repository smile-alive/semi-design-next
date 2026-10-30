import { type ComputedRef, type ShallowRef, computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, useId, watch, watchEffect } from 'vue';
import { COLOR_SCHEME_SELECTOR, colorSchemeOf, cssClasses, popupTarget, strings } from '@fibrae/semi-foundation/tooltip/constants';
import TooltipFoundation, { type TooltipAdapter } from '@fibrae/semi-foundation/tooltip/foundation';
import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import { openLayer } from '@fibrae/semi-foundation/utils/layer';
import warning from '@fibrae/semi-foundation/utils/warning';
import useEventListener, { getWindow } from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useTimeout from '../_base/use-timeout';
import useConfig from '../config-provider/use-config';
import { provideTooltipPopupsContext, useTooltipPopupsContext } from './context';
import type { FocusTarget, RenderContentProps, TooltipEmits, TooltipHandle, TooltipProps } from './interface';

interface TooltipState {
    visible: boolean;
    transitionState: 'enter' | 'leave' | '';
    triggerEventSet: Record<string, EventListener>;
    portalEventSet: Record<string, EventListener>;
    isInsert: boolean;
    portalTarget: HTMLElement | ShadowRoot | null;
    colorScheme?: string;
}

type Foundation = TooltipFoundation<TooltipProps, TooltipState>;
type Adapter = TooltipAdapter<TooltipProps, TooltipState>;
type Emit = <K extends keyof TooltipEmits>(name: K, ...args: TooltipEmits[K]) => void;

interface TooltipRuntime {
    foundation: Foundation;
    state: Readonly<ShallowRef<TooltipState>>;
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
    /** Hands a focus change inside this popup to the popups it was opened from. */
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

    // KeepAlive leaves the teleported popup on the page when the trigger is cached away; a popup is transient, so it
    // closes as if the pointer had left. A controlled owner may keep it open: tooltip.vue then disables the Teleport,
    // which moves the popup into the cached subtree, out of the document.
    const active = shallowRef(true);

    // handleOpened runs once per opening, though reactivation shows the popup again
    let openedHandled = false;
    let openPending = false;
    let closePending = false;

    const popupId = computed(() => props.wrapperId || `${cssClasses.PREFIX}-${generatedId}`);

    const { descendants, relayFocus } = usePopupRegistry(
        () => container.value,
        () => triggerElement.value,
        (event) => state.value.portalEventSet[event.type]?.(event)
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, TooltipProps, TooltipState>(
        TooltipFoundation,
        props,
        () => ({
            visible: false,
            transitionState: '',
            triggerEventSet: {},
            portalEventSet: {},
            isInsert: false,
            portalTarget: null,
        }),
        (base) => {
            const adapter: Omit<Adapter, keyof typeof base> = {
                insertPortal: () => {
                    const first = triggerElement.value;
                    openPending = true;
                    closePending = true;
                    openedHandled = false;
                    base.setState({
                        isInsert: true,
                        transitionState: 'enter',
                        visible: true,
                        portalTarget: popupTarget(first?.getRootNode(), (fullscreen) => Boolean(first && fullscreen.contains(first))),
                        colorScheme: colorSchemeOf(first?.closest(COLOR_SCHEME_SELECTOR)),
                    });
                },
                closePopup: () => base.setState({ transitionState: 'leave', visible: false }),
                removePortal: () => {
                    contentShown.value = false;
                    base.setState({ isInsert: false, transitionState: '' });
                },
                registerTriggerEvent: (triggerEventSet) => base.setState({ triggerEventSet }),
                registerPortalEvent: (portalEventSet) => base.setState({ portalEventSet }),
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
        hide: foundation.hide,
        rePosition: foundation.calcPosition,
    };

    const afterClose = () => {
        if (closePending) {
            closePending = false;
            emit('afterClose');
        }
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

    watch(
        () => [state.value.isInsert, state.value.transitionState, container.value, active.value] as const,
        ([inserted, transition, element, isActive], _, cleanup) => {
            if (!inserted || !element) {
                return;
            }
            if (transition === 'enter') {
                // showPopover() throws on a popup cached out of the document, and the browser hides one taken out of
                // it without showing it again when it is moved back, so it is shown on every activation
                if (!isActive) {
                    return;
                }
                // reopened during its exit animation, it is still shown
                if (!element.matches(':popover-open')) {
                    element.showPopover();
                }
                foundation.handleShown();
                // read right after showPopover() to see the enter animation it started
                const entering = element.getAnimations();
                let cancelled = false;
                const timer = setTimeout(() => {
                    if (!openedHandled) {
                        openedHandled = true;
                        foundation.handleOpened();
                    }
                    void Promise.allSettled(entering.map((animation) => animation.finished)).then(() => {
                        // a hover popup that backed out in handleOpened, or one closed meanwhile, is leaving
                        if (!cancelled && openPending && foundation.getState('transitionState') === 'enter') {
                            openPending = false;
                            emit('afterOpen');
                        }
                    });
                });
                cleanup(() => {
                    cancelled = true;
                    clearTimeout(timer);
                });
            } else if (transition === 'leave') {
                let cancelled = false;
                cleanup(() => {
                    cancelled = true;
                });
                // The exit animation plays while the popup is still open, so it keeps the top layer; it hides once
                // that ends
                const finish = () => {
                    if (!cancelled) {
                        element.hidePopover();
                        if (!props.keepDOM) {
                            foundation.removePortal();
                        }
                        afterClose();
                    }
                };
                const animations = element.getAnimations();
                if (animations.length) {
                    void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
                } else {
                    finish();
                }
            }
        },
        { flush: 'post' }
    );

    watchEffect(
        (cleanup) => {
            const element = container.value;
            if (isOpen.value && element) {
                cleanup(openLayer({ element, modal: false, onEscape: foundation.handleEscape }));
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

    watch(
        () => [props.mouseEnterDelay, props.mouseLeaveDelay] as const,
        ([enter, leave]) => {
            warning((leave ?? 0) < (enter ?? 0), strings.LEAVE_DELAY_WARNING);
        },
        { immediate: true }
    );

    watch(() => props.position, foundation.calcPosition, { flush: 'post' });
    watch(() => props.trigger, foundation.rebindEvents, { flush: 'post' });
    watch(() => props.clickToHide, foundation.rebindEvents, { flush: 'post' });
    watch(() => props.visible, foundation.handleVisiblePropChange, { flush: 'post' });

    watch(
        () => props.condition,
        (condition) => {
            if (condition === false) foundation.hide();
        },
        { flush: 'post' }
    );

    const scheduleTimeout = useTimeout();

    onMounted(() => scheduleTimeout(foundation.updateStateIfCursorOnTrigger));

    // Vue drops emits after unmount, so the final close is reported in beforeUnmount
    onBeforeUnmount(afterClose);

    onDeactivated(() => {
        active.value = false;
        foundation.hide();
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
