import { type JSX, For, Show, Suspense, batch, children, createEffect, createMemo, createSignal, on, createUniqueId, lazy, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tag-input/constants';
import TagInputFoundation, { type OnSortEndProps, type TagInputAdapter, type TagSortIds } from '@fibrae/semi-foundation/tag-input/foundation';
import { focusTagStop, getFocusedTagStop } from '@fibrae/semi-foundation/tag-input/utils/tag-focus';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/tag-input/tag-input.scss';
import { IconClear, IconHandle } from '@fibrae/semi-icons-solid';
import autofocus from '../_base/autofocus';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import type { SortableHandle } from '../_sortable/types';
import Input, { type InputChangeEvent, type InputElementEvent } from '../input';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover';
import Tag from '../tag';
import { useSpecialTrigger } from '../tooltip/context';
import type { ShowTooltip } from '../typography';
import Paragraph from '../typography/paragraph';

// dnd-kit is only needed once a draggable TagInput is active
const Sortable = lazy(() => import('../_sortable').then((module) => ({ default: module.Sortable })));

const prefixCls = cssClasses.PREFIX;

export type TagInputSize = Size;
export type RestTagsPopoverProps = PopoverProps;
export type TagInputValidateStatus = 'default' | 'error' | 'warning';

/** Focus entering or leaving the whole TagInput; focus moving among its input, tags and buttons does not fire it */
type TagInputFocusEvent = FocusEvent & { currentTarget: HTMLDivElement; target: Element };

export interface TagInputProps extends ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'placeholder'> {
    clearIcon?: JSX.Element;
    defaultValue?: string[];
    disabled?: boolean;
    inputValue?: string;
    /** Attached to the text input */
    name?: string;
    /** Maximum length of one tag */
    maxLength?: number;
    /** Maximum number of tags */
    max?: number;
    maxTagCount?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: RestTagsPopoverProps;
    showContentTooltip?: boolean | ShowTooltip;
    allowDuplicates?: boolean;
    addOnBlur?: boolean;
    draggable?: boolean;
    expandRestTagsOnClick?: boolean;
    onAdd?: (addedValue: string[]) => void;
    onBlur?: (e: TagInputFocusEvent) => void;
    onChange?: (value: string[]) => void;
    /** The whole list before it is cut to `max` */
    onExceed?: (value: string[]) => void;
    onFocus?: (e: TagInputFocusEvent) => void;
    /** The event is an input event (typing), KeyboardEvent (Enter adds), FocusEvent (addOnBlur), MouseEvent (clear) or CompositionEvent (IME truncation) */
    onInputChange?: (value: string, e: Event) => void;
    onInputExceed?: (value: string) => void;
    onKeyDown?: (e: InputElementEvent<KeyboardEvent>) => void;
    onRemove?: (removedValue: string, idx: number) => void;
    placeholder?: string;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    prefix?: JSX.Element;
    renderTagItem?: (value: string, index: number, onClose: () => void) => JSX.Element;
    separator?: string | string[] | null;
    showClear?: boolean;
    size?: TagInputSize;
    split?: (originString: string, separators: string | string[] | null) => string[];
    suffix?: JSX.Element;
    validateStatus?: TagInputValidateStatus;
    /** The tags; `null` means controlled with no tags */
    value?: string[] | null;
    /** Focuses the input on mount, with `preventScroll` */
    autofocus?: boolean;
    'aria-label'?: string;
    preventScroll?: boolean;
}

export interface TagInputState {
    tagsArray: string[];
    inputValue: string;
    focusing: boolean;
    active: boolean;
    // whether the user is in a new IME composition session
    entering: boolean;
}

type Foundation = TagInputFoundation<TagInputProps, TagInputState, Event>;
type Adapter = TagInputAdapter<TagInputProps, TagInputState, Event>;

const defaultProps = {
    showClear: false,
    addOnBlur: false,
    allowDuplicates: true,
    showRestTagsPopover: true,
    autofocus: false,
    draggable: false,
    expandRestTagsOnClick: true,
    showContentTooltip: true,
    separator: ',',
    size: 'default',
    validateStatus: 'default',
} satisfies Partial<TagInputProps>;

function SortContainer(props: { children?: JSX.Element }) {
    return <div class={`${prefixCls}-sortable-list`}>{props.children}</div>;
}

// Switching between the plain list, the Suspense fallback and the sortable list remounts every tag. Rendered first in
// each list, this cleanup runs before Solid swaps that list's DOM, and the mount after the new list is in place.
function TagFocusKeeper(props: { keep: () => void; restore: () => void }) {
    onMount(() => props.restore());
    onCleanup(() => props.keep());

    return null;
}

export default function TagInput(rawProps: TagInputProps) {
    const props = useDefaultProps('TagInput', rawProps, defaultProps);

    // validateStatus, insetLabel and insetLabelId are read from props: the Form-injected keys never reach the split
    const [local, rest] = splitProps(omitFormInjected(props), [
        'aria-activedescendant',
        'aria-autocomplete',
        'aria-controls',
        'aria-describedby',
        'aria-errormessage',
        'aria-expanded',
        'aria-haspopup',
        'aria-invalid',
        'aria-label',
        'aria-labelledby',
        'aria-required',
        'autofocus',
        'class',
        'clearIcon',
        'disabled',
        'draggable',
        'id',
        'name',
        'onClick',
        'onFocusIn',
        'onFocusOut',
        'onMouseDown',
        'placeholder',
        'preventScroll',
        'prefix',
        'ref',
        'renderTagItem',
        'restTagsPopoverProps',
        'role',
        'showClear',
        'showContentTooltip',
        'showRestTagsPopover',
        'size',
        'style',
        'suffix',
        // the root is a group, not a focus target; a tabIndex (Tooltip injects 0) belongs on the input
        'tabIndex',
        'tabindex',
        // declared for the foundation, which reads them from props
        'addOnBlur',
        'allowDuplicates',
        'defaultValue',
        'expandRestTagsOnClick',
        'inputValue',
        'max',
        'maxLength',
        'maxTagCount',
        'onAdd',
        'onBlur',
        'onChange',
        'onExceed',
        'onFocus',
        'onInputChange',
        'onInputExceed',
        'onKeyDown',
        'onRemove',
        'separator',
        'split',
        'value',
    ]);

    const locale = useLocale('TagInput');
    const tagLocale = useLocale('Tag');

    let root: HTMLDivElement | undefined;
    let wrapper: HTMLDivElement | undefined;
    let input: HTMLInputElement | undefined;
    let dragging = false;
    let focusedTagStop = -1;

    // A finished sort is recorded as a request; the sortIds memo below attaches it to the ids only once, since
    // attaching it again on a later change of the value would move ids that already follow that sort
    const [moveRequest, setMoveRequest] = createSignal<{ move: OnSortEndProps }>();

    // a rendered inset label names the input (WCAG 2.5.3), so it needs an id even when the caller gives none
    const generatedLabelId = createUniqueId();

    const { foundation, state } = useFoundation<Foundation, Adapter, TagInputProps, TagInputState>(
        TagInputFoundation,
        props,
        (view) => ({
            tagsArray: view.defaultValue || [],
            inputValue: '',
            focusing: false,
            active: false,
            entering: false,
        }),
        (base) => ({
            setInputValue: (inputValue) => base.setState({ inputValue }),
            setTagsArray: (tagsArray) => base.setState({ tagsArray }),
            setFocusing: (focusing) => base.setState({ focusing }),
            toggleFocusing: (isFocus) => {
                if (isFocus) {
                    input?.focus({ preventScroll: props.preventScroll });
                } else {
                    input?.blur();
                }
                base.setState({ focusing: isFocus });
            },
            setActive: (active) => base.setState({ active }),
            setEntering: (entering) => base.setState({ entering }),
            notifyBlur: (e) => props.onBlur?.(e),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyInputChange: (value, e) => props.onInputChange?.(value, e),
            notifyTagChange: (value) => props.onChange?.(value),
            notifyTagAdd: (value) => props.onAdd?.(value),
            notifyTagRemove: (value, idx) => props.onRemove?.(value, idx),
            notifyKeyDown: (e) => props.onKeyDown?.(e),
            notifyInputExceed: (value) => props.onInputExceed?.(value),
            notifyExceed: (tagList) => props.onExceed?.(tagList),
            getInput: () => input ?? null,
        })
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: props.disabled }),
        () => local.ref
    );

    const tagsArray = createMemo(() => TagInputFoundation.getTagsArray(props, state()));
    const prefix = createIconSlot(() => local.prefix);
    const insetLabel = createIconSlot(() => props.insetLabel);
    const suffix = createIconSlot(() => local.suffix);
    const clearIcon = children(() => local.clearIcon);
    const ellipsis = createMemo(() => ({ showTooltip: local.showContentTooltip, rows: 1 }));

    const inputValue = () => TagInputFoundation.getInputValue(props, state());

    const active = () => state().active;

    const markInside = useClickOutside([() => root], () => foundation.deactivate(), active);

    const sortIds = createMemo<{ ids: TagSortIds; handled?: object }>(
        (previous) => {
            const request = moveRequest();
            const base = request && request !== previous.handled ? { ...previous.ids, move: request.move } : previous.ids;
            return { ids: TagInputFoundation.getSortIds(tagsArray(), base), handled: request };
        },
        { ids: TagInputFoundation.getSortIds(untrack(tagsArray)) }
    );

    const sortable = createMemo(() => active() && local.draggable && tagsArray().length > 0);

    // tags past maxTagCount fold into "+N" until the TagInput is active (or for good with expandRestTagsOnClick off);
    // a sortable list, and the plain list standing in while it loads, shows every tag
    const visibleCount = createMemo(() => {
        const limit = props.maxTagCount;
        return !sortable() && (!active() || !props.expandRestTagsOnClick) && limit && limit < tagsArray().length ? limit : tagsArray().length;
    });

    const visibleTags = createMemo(() => tagsArray().slice(0, visibleCount()));
    const restTags = createMemo(() => tagsArray().slice(visibleCount()));

    const prefixKind = () => prefix.kind();

    const insetLabelKind = () => insetLabel.kind();

    const labelKind = () => prefixKind() ?? insetLabelKind();

    const suffixKind = () => suffix.kind();

    const insetLabelShown = () => !prefixKind() && Boolean(insetLabelKind());

    const labelId = () => props.insetLabelId ?? (insetLabelShown() ? generatedLabelId : undefined);

    const insetNameId = () => (insetLabelShown() ? labelId() : undefined);

    const clearable = () => (inputValue() !== '' || tagsArray().length > 0) && !local.disabled;

    // A tag list is going: the input holds the focus while its nodes are removed, so the TagInput never sees it leave
    const keepTagFocus = () => {
        focusedTagStop = getFocusedTagStop(wrapper ?? null);
        if (focusedTagStop >= 0) {
            input?.focus({ preventScroll: true });
        }
    };

    // A tag list has come: the tag in the place of the one that had the focus takes it back
    const restoreTagFocus = () => {
        if (focusedTagStop >= 0) {
            focusTagStop(wrapper ?? null, focusedTagStop);
            focusedTagStop = -1;
        }
    };

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        // the root is not the focus target, so the handle the consumer's ref reaches goes to the input
        node.focus = (options) => {
            input?.focus({ preventScroll: props.preventScroll, ...options });
            if (!props.disabled) {
                foundation.handleClick();
            }
        };
        node.blur = () => {
            const focused = FocusTrapHandle.getActiveElement(node);
            if (focused instanceof HTMLElement && node.contains(focused)) {
                focused.blur();
            }
            foundation.deactivate();
        };
        registerTrigger(node);
    };

    // A removed node fires no blur, so the clear button going while it has the focus would drop the focus on the body
    // with the TagInput still focused; the input takes it first
    const setClearButton = (node: HTMLButtonElement) => {
        onCleanup(() => {
            if (node === FocusTrapHandle.getActiveElement(node)) {
                input?.focus({ preventScroll: props.preventScroll });
            }
        });
    };

    const TagItem = (itemProps: { value: string; index: number; sortableHandle?: SortableHandle }) => {
        // a list keeps its handle for as long as it lives: Sortable gives one to every item, the plain list none
        const DragHandle = untrack(() => itemProps.sortableHandle)?.(() => <IconHandle class={`${prefixCls}-drag-handler`} />);
        const showIconHandler = () => active() && local.draggable;

        // Tag calls onClose(children, event): preventDefault stops Tag from hiding itself when a renderTagItem passes
        // this callback to its own Tag
        const onClose = (_children?: unknown, e?: Event) => {
            e?.preventDefault?.();
            if (local.disabled) {
                return;
            }
            if (root?.contains(FocusTrapHandle.getActiveElement(root))) {
                input?.focus({ preventScroll: props.preventScroll });
            }
            foundation.handleTagClose(itemProps.index);
        };

        const defaultTag = () => (
            <Tag
                type="light"
                class={clsx(`${prefixCls}-wrapper-tag`, {
                    [`${prefixCls}-wrapper-tag-size-${local.size}`]: local.size,
                    // the handle's wrapper carries the start padding; without a handle (the Sortable still loading) the tag does
                    [`${prefixCls}-wrapper-tag-icon`]: showIconHandler() && !DragHandle,
                })}
                // only the closable tag is a button that takes a name; a disabled one is static text.
                // A function replacer keeps `$&` and `$$` in the value literal
                aria-label={local.disabled ? undefined : tagLocale().locale.closableTag.replace('${tag}', () => itemProps.value)}
                closable={!local.disabled}
                color="white"
                size={local.size === 'small' ? 'small' : 'large'}
                visible
                onClose={onClose}
            >
                <Paragraph class={clsx(`${prefixCls}-wrapper-typo`, { [`${prefixCls}-wrapper-typo-disabled`]: local.disabled })} ellipsis={ellipsis()}>
                    {itemProps.value}
                </Paragraph>
            </Tag>
        );

        // the closable tag is a button, so the handle sits beside it instead of nesting inside
        const withHandle = (content: () => JSX.Element) =>
            DragHandle ? (
                <div class={clsx({ [`${prefixCls}-drag-item`]: showIconHandler(), [`${prefixCls}-wrapper-tag-icon`]: showIconHandler() })}>
                    <DragHandle />
                    {content()}
                </div>
            ) : (
                content()
            );

        // Show runs its child untracked; the fragment is what calls render again when the tag's index or value changes
        return (
            <Show keyed when={local.renderTagItem} fallback={withHandle(defaultTag)}>
                {(render) => withHandle(() => <>{render(itemProps.value, itemProps.index, onClose)}</>)}
            </Show>
        );
    };

    const restLabel = (triggerProps?: object) => (
        <span {...triggerProps} class={clsx(`${prefixCls}-wrapper-n`, { [`${prefixCls}-wrapper-n-disabled`]: local.disabled })}>
            +{restTags().length}
        </span>
    );

    const PlainTags = () => (
        <>
            <TagFocusKeeper keep={keepTagFocus} restore={restoreTagFocus} />
            <For each={visibleTags()}>{(value, index) => <TagItem value={value} index={index()} />}</For>
            <Show when={restTags().length > 0}>
                <Show when={local.showRestTagsPopover} fallback={restLabel()}>
                    <Popover autoAdjustOverflow content={<For each={restTags()}>{(value, index) => <TagItem value={value} index={visibleCount() + index()} />}</For>} position="top" showArrow trigger="hover" {...local.restTagsPopoverProps}>
                        {(getTriggerProps) => restLabel(getTriggerProps())}
                    </Popover>
                </Show>
            </Show>
        </>
    );

    // an item is rendered once per id, so its place in the list is read live
    const SortableTagItem = (itemProps: { id: string; sortableHandle: SortableHandle }) => {
        const index = () => sortIds().ids.ids.indexOf(itemProps.id);
        return <TagItem value={tagsArray()[index()]} index={index()} sortableHandle={itemProps.sortableHandle} />;
    };

    const SortableTags = () => (
        <Suspense fallback={<PlainTags />}>
            <TagFocusKeeper keep={keepTagFocus} restore={restoreTagFocus} />
            <Sortable
                container={SortContainer}
                dragHandleLabel={locale().locale.dragSort}
                dragOverlayCls={`${prefixCls}-drag-item-move`}
                items={sortIds().ids.ids}
                transition={null}
                prefix={prefixCls}
                renderItem={(item) => <SortableTagItem id={item.id as string} sortableHandle={item.sortableHandle} />}
                onDraggingChange={(isDragging) => (dragging = isDragging)}
                onSortEnd={(move) =>
                    batch(() => {
                        setMoveRequest({ move });
                        foundation.handleSortEnd(move);
                    })
                }
            />
        </Suspense>
    );

    // only leaving control empties what the state kept
    useWatch(
        () => props.value === undefined,
        (uncontrolled) => uncontrolled && foundation.setState({ tagsArray: [] })
    );

    useWatch(
        () => props.inputValue === undefined,
        (uncontrolled) => uncontrolled && foundation.setState({ inputValue: '' })
    );

    createEffect(on([inputValue, () => tagsArray().length === 0, () => local.placeholder, () => local.size], () => foundation.fitInputWidth()));

    onMount(() => {
        if (!props.disabled && props.autofocus) {
            autofocus(true, input, { preventScroll: props.preventScroll });
            foundation.handleClick();
        }
    });

    return (
        <div
            {...rest}
            ref={mergeRefs(setRoot, local.ref)}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-focus`]: state().focusing || active(),
                [`${prefixCls}-disabled`]: local.disabled,
                [`${prefixCls}-error`]: props.validateStatus === 'error',
                [`${prefixCls}-warning`]: props.validateStatus === 'warning',
                [`${prefixCls}-small`]: local.size === 'small',
                [`${prefixCls}-large`]: local.size === 'large',
                [`${prefixCls}-with-prefix`]: Boolean(labelKind()),
                [`${prefixCls}-with-suffix`]: Boolean(suffixKind()),
            })}
            style={local.style}
            // the input, tags and clear button form one control, so the group carries its disabled state as a whole
            aria-disabled={local.disabled || undefined}
            role="group"
            // focus moving between the input, the tags and the clear button stays inside the TagInput
            onFocusOut={(e) => {
                callHandler(local.onFocusOut, e);
                // Chromium blurs the picked-up handle when dnd-kit moves it; that is not the focus leaving, and ending
                // the active state would unmount the list under the drag
                if (dragging) {
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    foundation.handleInputBlur(e);
                }
            }}
            onFocusIn={(e) => {
                callHandler(local.onFocusIn, e);
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    foundation.handleInputFocus(e);
                }
            }}
            onClick={(e) => {
                callHandler(local.onClick, e);
                foundation.handleClick();
            }}
            onMouseDown={(e) => {
                markInside(e);
                callHandler(local.onMouseDown, e);
            }}
        >
            <Show when={labelKind()}>
                <div
                    id={labelId()}
                    class={clsx(`${prefixCls}-prefix`, {
                        [`${prefixCls}-inset-label`]: Boolean(insetLabelKind()),
                        [`${prefixCls}-prefix-text`]: labelKind() === 'text',
                        [`${prefixCls}-prefix-icon`]: labelKind() === 'icon',
                    })}
                    x-semi-prop="prefix"
                    onClick={() => foundation.handleClickPrefixOrSuffix()}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {prefixKind() ? prefix() : insetLabel()}
                </div>
            </Show>
            <div ref={(node) => (wrapper = node)} class={`${prefixCls}-wrapper`}>
                <Show when={sortable()} fallback={<PlainTags />}>
                    <SortableTags />
                </Show>
                <Input
                    inputRef={(node) => (input = node)}
                    id={local.id}
                    name={local.name}
                    class={clsx(`${prefixCls}-wrapper-input`, `${prefixCls}-wrapper-input-${local.size}`)}
                    aria-activedescendant={local['aria-activedescendant']}
                    aria-autocomplete={local['aria-autocomplete']}
                    aria-controls={local['aria-controls']}
                    aria-describedby={local['aria-describedby']}
                    aria-errormessage={local['aria-errormessage']}
                    aria-expanded={local['aria-expanded']}
                    aria-haspopup={local['aria-haspopup']}
                    // the value under validation is the text field's, and group does not support aria-invalid
                    aria-invalid={local['aria-invalid'] ?? (props.validateStatus === 'error' ? true : undefined)}
                    // a Form label reaches the input through `id`; without any name source it would have no name
                    aria-label={local['aria-label'] ?? (local['aria-labelledby'] || local.id || insetNameId() ? undefined : locale().locale.input)}
                    aria-labelledby={local['aria-labelledby'] ?? (local['aria-label'] ? undefined : insetNameId())}
                    aria-required={local['aria-required']}
                    role={local.role}
                    tabIndex={local.tabIndex ?? local.tabindex}
                    disabled={local.disabled}
                    placeholder={tagsArray().length === 0 ? local.placeholder : ''}
                    value={inputValue()}
                    // the wrapper draws the label, clear button and suffix: global Input defaults must not add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    size={local.size}
                    prefix={null}
                    suffix={null}
                    onChange={(value: string, e: InputChangeEvent) => foundation.handleInputChange(value, e)}
                    onCompositionEnd={foundation.handleInputCompositionEnd}
                    onCompositionStart={foundation.handleInputCompositionStart}
                    onKeyDown={foundation.handleKeyDown}
                />
            </div>
            <Show when={local.showClear}>
                <Show when={clearable()} fallback={<span class={`${prefixCls}-clearBtn-placeholder`} />}>
                    <button
                        ref={setClearButton}
                        type="button"
                        class={`${prefixCls}-clearBtn`}
                        aria-label={locale().locale.clear}
                        onClick={(e) => {
                            foundation.handleClearBtn(e);
                            input?.focus({ preventScroll: props.preventScroll });
                        }}
                    >
                        <Show when={hasContent(clearIcon())} fallback={<IconClear />}>
                            {clearIcon()}
                        </Show>
                    </button>
                </Show>
            </Show>
            <Show when={suffixKind()}>
                <div
                    class={clsx(`${prefixCls}-suffix`, {
                        [`${prefixCls}-suffix-text`]: suffixKind() === 'text',
                        [`${prefixCls}-suffix-icon`]: suffixKind() === 'icon',
                    })}
                    x-semi-prop="suffix"
                    onClick={() => foundation.handleClickPrefixOrSuffix()}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {suffix()}
                </div>
            </Show>
        </div>
    );
}
