import type React from 'react';
import { Fragment, lazy, Suspense, useCallback, useId, useImperativeHandle, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { type strings, cssClasses } from '@fibrae/semi-foundation/tag-input/constants';
import TagInputFoundation, { type TagInputAdapter } from '@fibrae/semi-foundation/tag-input/foundation';
import { focusTagStop, getFocusedTagStop } from '@fibrae/semi-foundation/tag-input/utils/tag-focus';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/tag-input/tag-input.scss';
import { IconClear, IconHandle } from '@fibrae/semi-icons-react';
import type { ArrayElement, ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useEventListener, { getDocument } from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import type { RenderItemProps } from '../_sortable';
import type { SortableHandle } from '../_sortable/types';
import { hasContent, isSemiIcon, isText } from '../_utils';
import Input, { type InputHandle } from '../input';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover';
import Tag from '../tag';
import type { ShowTooltip } from '../typography';
import Paragraph from '../typography/paragraph';

// dnd-kit is only needed once a draggable TagInput is active
const Sortable = lazy(() => import('../_sortable').then((module) => ({ default: module.Sortable })));

const prefixCls = cssClasses.PREFIX;

export type Size = ArrayElement<typeof strings.SIZE_SET>;
export type RestTagsPopoverProps = PopoverProps;
export type ValidateStatus = 'default' | 'error' | 'warning';

function SortContainer(props) {
    return <div className={`${prefixCls}-sortable-list`} {...props} />;
}

export interface TagInputHandle {
    focus: () => void;
    blur: () => void;
}

export interface TagInputProps extends ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown'> {
    className?: string;
    clearIcon?: React.ReactNode;
    defaultValue?: string[];
    disabled?: boolean;
    inputValue?: string;
    maxLength?: number;
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
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onChange?: (value: string[]) => void;
    onExceed?: (value: string[]) => void;
    onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
    // The event is a ChangeEvent (typing), KeyboardEvent (Enter adds), FocusEvent (addOnBlur), MouseEvent (clear) or CompositionEvent (IME truncation)
    onInputChange?: (value: string, e: React.SyntheticEvent) => void;
    onInputExceed?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onRemove?: (removedValue: string, idx: number) => void;
    placeholder?: string;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    prefix?: React.ReactNode;
    renderTagItem?: (value: string, index: number, onClose: () => void) => React.ReactNode;
    separator?: string | string[] | null;
    showClear?: boolean;
    size?: Size;
    split?: (originString: string, separators: string | string[] | null) => string[];
    style?: React.CSSProperties;
    suffix?: React.ReactNode;
    validateStatus?: ValidateStatus;
    value?: string[] | null;
    autoFocus?: boolean;
    'aria-label'?: string;
    preventScroll?: boolean;
    /** The `focus` and `blur` methods; the root div is not exposed */
    ref?: React.Ref<TagInputHandle>;
}

export interface TagInputState {
    tagsArray?: string[];
    inputValue?: string;
    focusing?: boolean;
    active?: boolean;
    // whether the user is in a new IME composition session
    entering?: boolean;
}

// Form, or a combobox built on TagInput (Cascader, TreeSelect), injects these; they describe the text input, which
// is the control, not the root div. Such a combobox makes the input itself the combobox (ARIA 1.2), hence the role
type FieldA11yProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'role' | 'aria-activedescendant' | 'aria-autocomplete' | 'aria-controls' | 'aria-describedby' | 'aria-errormessage' | 'aria-expanded' | 'aria-haspopup' | 'aria-invalid' | 'aria-labelledby' | 'aria-required'>;

const defaultProps = {
    showClear: false,
    addOnBlur: false,
    allowDuplicates: true,
    showRestTagsPopover: true,
    autoFocus: false,
    draggable: false,
    expandRestTagsOnClick: true,
    showContentTooltip: true,
    separator: ',',
    size: 'default',
    validateStatus: 'default',
    onBlur: noop,
    onFocus: noop,
    onChange: noop,
    onInputChange: noop,
    onExceed: noop,
    onInputExceed: noop,
    onAdd: noop,
    onRemove: noop,
    onKeyDown: noop,
} satisfies Partial<TagInputProps>;

// holds the DOM nodes for the adapter, which is created during render and must not read refs
class TagInputRuntime {
    #dragging = false;
    #wrapper: HTMLDivElement | null = null;
    #focusedTagStop = -1;
    root: HTMLDivElement | null = null;
    input: HTMLInputElement | null = null;

    attachRoot(node: HTMLDivElement | null) {
        this.root = node;
    }

    get dragging() {
        return this.#dragging;
    }

    setDragging(dragging: boolean) {
        this.#dragging = dragging;
    }

    attachWrapper(node: HTMLDivElement | null) {
        this.#wrapper = node;
    }

    // A tag list is going: the input holds the focus while its nodes are removed, so the TagInput never sees it leave
    keepTagFocus() {
        this.#focusedTagStop = getFocusedTagStop(this.#wrapper);
        if (this.#focusedTagStop >= 0) {
            this.input?.focus({ preventScroll: true });
        }
    }

    // A tag list has come: the tag in the place of the one that had the focus takes it back
    restoreTagFocus() {
        if (this.#focusedTagStop >= 0) {
            focusTagStop(this.#wrapper, this.#focusedTagStop);
            this.#focusedTagStop = -1;
        }
    }

    // Input never remounts its native input, so the node read from the handle once stays current
    attachInput(handle: InputHandle | null) {
        this.input = handle?.input ?? null;
    }
}

// Switching between the plain list, the Suspense fallback and the sortable list remounts every tag. Rendered first in
// each list, this cleanup runs before React removes that list's tags, and the effect after the new list is in place.
function TagFocusKeeper({ runtime }: { runtime: TagInputRuntime }) {
    useLayoutEffect(() => {
        runtime.restoreTagFocus();
        return () => runtime.keepTagFocus();
    }, [runtime]);

    return null;
}

export default function TagInput(rawProps: TagInputProps) {
    const props = useDefaultProps('TagInput', rawProps, defaultProps);

    const {
        ref,
        className,
        clearIcon,
        defaultValue,
        disabled,
        inputValue: inputValueProp,
        maxLength,
        max,
        maxTagCount,
        showRestTagsPopover,
        restTagsPopoverProps = {},
        showContentTooltip,
        allowDuplicates,
        addOnBlur,
        draggable,
        expandRestTagsOnClick,
        onAdd,
        onBlur,
        onChange,
        onExceed,
        onFocus,
        onInputChange,
        onInputExceed,
        onKeyDown,
        onRemove,
        placeholder,
        insetLabel,
        insetLabelId,
        prefix,
        renderTagItem,
        separator,
        showClear,
        size,
        split,
        style,
        suffix,
        validateStatus,
        value,
        autoFocus,
        'aria-label': ariaLabel,
        preventScroll,
        ...rest
    } = props;

    const { locale } = useLocale('TagInput');
    const { locale: tagLocale } = useLocale('Tag');

    const [runtime] = useState(() => new TagInputRuntime());

    const [foundation, state] = useFoundation<TagInputFoundation<TagInputProps, TagInputState, React.SyntheticEvent>, TagInputAdapter<TagInputProps, TagInputState, React.SyntheticEvent>, TagInputProps, TagInputState>(
        TagInputFoundation,
        props,
        () => ({
            tagsArray: props.defaultValue || [],
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
                    runtime.input?.focus({ preventScroll: base.getProps().preventScroll });
                } else {
                    runtime.input?.blur();
                }
                base.setState({ focusing: isFocus });
            },
            setActive: (active) => base.setState({ active }),
            setEntering: (entering) => base.setState({ entering }),
            notifyBlur: (e) => base.getProps().onBlur(e),
            notifyFocus: (e) => base.getProps().onFocus(e),
            notifyInputChange: (v, e) => base.getProps().onInputChange(v, e),
            notifyTagChange: (v) => base.getProps().onChange(v),
            notifyTagAdd: (v) => base.getProps().onAdd(v),
            notifyTagRemove: (v, idx) => base.getProps().onRemove(v, idx),
            notifyKeyDown: (e) => base.getProps().onKeyDown(e),
            notifyInputExceed: (value) => base.getProps().onInputExceed?.(value),
            notifyExceed: (tagList) => base.getProps().onExceed?.(tagList),
            getInput: () => runtime.input,
        })
    );

    const {
        id,
        name,
        role,
        'aria-activedescendant': ariaActivedescendant,
        'aria-autocomplete': ariaAutocomplete,
        'aria-controls': ariaControls,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHaspopup,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        // the root is a group, not a focus target; a tabIndex (Tooltip injects 0) belongs on the input
        tabIndex,
        ...rootRest
    } = rest as typeof rest & FieldA11yProps;

    const tagsArray = TagInputFoundation.getTagsArray(props, state);
    const inputValue = TagInputFoundation.getInputValue(props, state);
    const { focusing, active } = state;

    const [sortIds, setSortIds] = useState(() => TagInputFoundation.getSortIds(tagsArray));

    const nextSortIds = sortIds.values === tagsArray ? sortIds : TagInputFoundation.getSortIds(tagsArray, sortIds);

    // the placeholder shows only while there are no tags
    const showPlaceholder = tagsArray.length === 0;

    useDidUpdate(props.value, (value) => {
        if (value === undefined) {
            foundation.setState({ tagsArray: [] });
        }
    });

    // the state keeps what was typed under control; leaving control must not bring it back
    useDidUpdate(props.inputValue, (inputValue) => {
        if (inputValue === undefined) {
            foundation.setState({ inputValue: '' });
        }
    });

    const generatedLabelId = useId();

    if (nextSortIds !== sortIds) {
        setSortIds(nextSortIds);
    }

    let tagsNode: React.ReactNode;

    const setRoot = useCallback((node: HTMLDivElement | null) => runtime.attachRoot(node), [runtime]);

    const setWrapper = useCallback((node: HTMLDivElement | null) => runtime.attachWrapper(node), [runtime]);

    const setInput = useCallback((handle: InputHandle | null) => runtime.attachInput(handle), [runtime]);

    // A removed node fires no blur, so a tag or the clear button going while it has the focus would drop the focus on
    // the body with the TagInput still focused; the input takes it first
    const setClearButton = useCallback(
        (node: HTMLButtonElement) => () => {
            if (node === FocusTrapHandle.getActiveElement(node)) {
                runtime.input?.focus({ preventScroll: foundation.getProps().preventScroll });
            }
        },
        [runtime, foundation]
    );

    const renderTag = (tagValue: any, index: number, sortableHandle?: SortableHandle, sortableId?: React.Key) => {
        const showIconHandler = active && draggable;
        const hasHandle = showIconHandler && sortableHandle;
        const tagCls = clsx(`${prefixCls}-wrapper-tag`, {
            [`${prefixCls}-wrapper-tag-size-${size}`]: size,
            // the handle's wrapper carries the start padding; without a handle (the Sortable still loading) the tag does
            [`${prefixCls}-wrapper-tag-icon`]: showIconHandler && !sortableHandle,
        });
        const typoCls = clsx(`${prefixCls}-wrapper-typo`, {
            [`${prefixCls}-wrapper-typo-disabled`]: disabled,
        });
        const itemWrapperCls = clsx({
            [`${prefixCls}-drag-item`]: showIconHandler,
            [`${prefixCls}-wrapper-tag-icon`]: showIconHandler,
        });
        const DragHandle = sortableHandle && sortableHandle(() => <IconHandle className={`${prefixCls}-drag-handler`} />);
        const elementKey = sortableId ?? `${index}-${tagValue}`;
        // Tag calls onClose(children, event): preventDefault stops Tag from hiding itself when a renderTagItem
        // passes this callback to its own Tag
        const onClose = (_children?: unknown, e?: { preventDefault?: () => void }) => {
            if (e && typeof e.preventDefault === 'function') {
                e.preventDefault();
            }
            if (!disabled) {
                if (runtime.root?.contains(FocusTrapHandle.getActiveElement(runtime.root))) {
                    runtime.input?.focus({ preventScroll });
                }
                foundation.handleTagClose(index);
            }
        };
        if (typeof renderTagItem === 'function') {
            if (hasHandle) {
                return (
                    <div key={elementKey} className={itemWrapperCls}>
                        <DragHandle />
                        {renderTagItem(tagValue, index, onClose)}
                    </div>
                );
            }
            // the user's node may carry no key
            return <Fragment key={elementKey}>{renderTagItem(tagValue, index, onClose)}</Fragment>;
        }
        const tag = (
            <Tag
                key={hasHandle ? undefined : elementKey}
                type="light"
                className={tagCls}
                // only the closable tag is a button that takes a name; a disabled one is static text
                // a function replacer keeps `$&` and `$$` in the value literal
                aria-label={disabled ? undefined : tagLocale.closableTag.replace('${tag}', () => String(tagValue))}
                closable={!disabled}
                color="white"
                size={size === 'small' ? 'small' : 'large'}
                visible
                onClose={onClose}
            >
                <Paragraph className={typoCls} ellipsis={{ showTooltip: showContentTooltip, rows: 1 }}>
                    {tagValue}
                </Paragraph>
            </Tag>
        );
        // the closable tag is a button, so the handle sits beside it instead of nesting inside
        return hasHandle ? (
            <div key={elementKey} className={itemWrapperCls}>
                <DragHandle />
                {tag}
            </div>
        ) : (
            tag
        );
    };

    const allTags = tagsArray.map((tagValue, index) => renderTag(tagValue, index));

    // mousedown: a press inside released outside makes a click on their common ancestor, which reads as outside
    useEventListener(
        getDocument,
        'mousedown',
        (e) => {
            if (!isEventInside(e, runtime.root)) {
                foundation.deactivate();
            }
        },
        { enabled: active }
    );

    useLayoutEffect(() => {
        const { disabled: isDisabled, autoFocus: shouldFocus, preventScroll: noScroll } = foundation.getProps();
        if (!isDisabled && shouldFocus) {
            runtime.input?.focus({ preventScroll: noScroll });
            foundation.handleClick();
        }
    }, [foundation, runtime]);

    useLayoutEffect(() => {
        foundation.fitInputWidth();
    }, [foundation, inputValue, showPlaceholder, placeholder, size]);

    useImperativeHandle(
        ref,
        () => ({
            focus: () => {
                const { preventScroll: noScroll, disabled: isDisabled } = foundation.getProps();
                runtime.input?.focus({ preventScroll: noScroll });
                if (!isDisabled) {
                    foundation.handleClick();
                }
            },
            blur: () => {
                const focused = FocusTrapHandle.getActiveElement(runtime.root);
                if (focused instanceof HTMLElement && runtime.root?.contains(focused)) {
                    focused.blur();
                }
                foundation.deactivate();
            },
        }),
        [foundation, runtime]
    );

    if (active && draggable && tagsArray.length > 0) {
        const { ids } = nextSortIds;
        tagsNode = (
            <Suspense
                fallback={
                    <>
                        <TagFocusKeeper runtime={runtime} />
                        {allTags}
                    </>
                }
            >
                <TagFocusKeeper runtime={runtime} />
                <Sortable
                    container={SortContainer}
                    dragHandleLabel={locale.dragSort}
                    dragOverlayCls={`${prefixCls}-drag-item-move`}
                    items={ids}
                    transition={null}
                    prefix={prefixCls}
                    renderItem={(item: RenderItemProps) => {
                        const index = ids.indexOf(item.id as string);
                        return renderTag(tagsArray[index], index, item.sortableHandle, item.id);
                    }}
                    onDraggingChange={(dragging) => runtime.setDragging(dragging)}
                    onSortEnd={(move) => {
                        setSortIds((current) => ({ ...current, move }));
                        foundation.handleSortEnd(move);
                    }}
                />
            </Suspense>
        );
    } else {
        let tags = allTags;
        let restTags: React.ReactNode[] = [];
        if ((!active || !expandRestTagsOnClick) && maxTagCount && maxTagCount < allTags.length) {
            tags = allTags.slice(0, maxTagCount);
            restTags = allTags.slice(maxTagCount);
        }
        const restTagsContent = <span className={clsx(`${prefixCls}-wrapper-n`, { [`${prefixCls}-wrapper-n-disabled`]: disabled })}>+{tagsArray.length - maxTagCount}</span>;
        tagsNode = (
            <>
                <TagFocusKeeper runtime={runtime} />
                {tags}
                {restTags.length > 0 &&
                    (showRestTagsPopover ? (
                        <Popover autoAdjustOverflow content={restTags} position="top" showArrow trigger="hover" {...restTagsPopoverProps}>
                            {restTagsContent}
                        </Popover>
                    ) : (
                        restTagsContent
                    ))}
            </>
        );
    }

    let clearNode: React.ReactNode = null;

    const labelNode = hasContent(prefix) ? prefix : insetLabel;
    const insetLabelShown = !hasContent(prefix) && hasContent(insetLabel);

    // a rendered inset label names the input (WCAG 2.5.3), so it needs an id even when the caller gives none
    const prefixId = insetLabelId ?? (insetLabelShown ? generatedLabelId : undefined);
    const insetNameId = insetLabelShown ? prefixId : undefined;

    const prefixNode = hasContent(labelNode) ? (
        <div
            id={prefixId}
            className={clsx(`${prefixCls}-prefix`, {
                [`${prefixCls}-inset-label`]: hasContent(insetLabel),
                [`${prefixCls}-prefix-text`]: isText(labelNode),
                [`${prefixCls}-prefix-icon`]: isSemiIcon(labelNode),
            })}
            x-semi-prop="prefix"
            onClick={() => foundation.handleClickPrefixOrSuffix()}
            onMouseDown={(e) => e.preventDefault()}
        >
            {labelNode}
        </div>
    ) : null;

    const suffixNode = hasContent(suffix) ? (
        <div
            className={clsx(`${prefixCls}-suffix`, {
                [`${prefixCls}-suffix-text`]: isText(suffix),
                [`${prefixCls}-suffix-icon`]: isSemiIcon(suffix),
            })}
            x-semi-prop="suffix"
            onClick={() => foundation.handleClickPrefixOrSuffix()}
            onMouseDown={(e) => e.preventDefault()}
        >
            {suffix}
        </div>
    ) : null;

    const clearable = (inputValue !== '' || tagsArray.length > 0) && !disabled;

    if (showClear) {
        clearNode = clearable ? (
            <button
                ref={setClearButton}
                type="button"
                className={`${prefixCls}-clearBtn`}
                aria-label={locale.clear}
                onClick={(e) => {
                    foundation.handleClearBtn(e);
                    runtime.input?.focus({ preventScroll });
                }}
            >
                {clearIcon ? clearIcon : <IconClear />}
            </button>
        ) : (
            // keeps the button's room, so the input does not widen when the value goes
            <span className={`${prefixCls}-clearBtn-placeholder`} />
        );
    }

    const tagInputCls = clsx(prefixCls, className, {
        [`${prefixCls}-focus`]: focusing || active,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-error`]: validateStatus === 'error',
        [`${prefixCls}-warning`]: validateStatus === 'warning',
        [`${prefixCls}-small`]: size === 'small',
        [`${prefixCls}-large`]: size === 'large',
        [`${prefixCls}-with-prefix`]: prefixNode !== null,
        [`${prefixCls}-with-suffix`]: suffixNode !== null,
    });

    return (
        <div
            {...rootRest}
            ref={setRoot}
            className={tagInputCls}
            style={style}
            // the input, tags and clear button form one control, so the group carries its disabled state as a whole
            aria-disabled={disabled || undefined}
            role="group"
            // focus moving between the input, the tags and the clear button stays inside the TagInput
            onBlur={(e) => {
                // Chromium blurs the picked-up handle when dnd-kit moves it; that is not the focus leaving, and ending
                // the active state would unmount the list under the drag
                if (runtime.dragging) {
                    return;
                }
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    foundation.handleInputBlur(e);
                }
            }}
            onClick={(e) => {
                rootRest.onClick?.(e);
                foundation.handleClick();
            }}
            onFocus={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    foundation.handleInputFocus(e);
                }
            }}
        >
            {prefixNode}
            <div ref={setWrapper} className={`${prefixCls}-wrapper`}>
                {tagsNode}
                <Input
                    ref={setInput}
                    id={id}
                    name={name}
                    className={clsx(`${prefixCls}-wrapper-input`, `${prefixCls}-wrapper-input-${size}`)}
                    aria-activedescendant={ariaActivedescendant}
                    aria-autocomplete={ariaAutocomplete}
                    aria-controls={ariaControls}
                    aria-describedby={ariaDescribedby}
                    aria-errormessage={ariaErrormessage}
                    aria-expanded={ariaExpanded}
                    aria-haspopup={ariaHaspopup}
                    // the value under validation is the text field's, and group does not support aria-invalid
                    aria-invalid={ariaInvalid ?? (validateStatus === 'error' ? true : undefined)}
                    // a Form label reaches the input through `id`; without any name source it would have no name
                    aria-label={ariaLabel ?? (ariaLabelledby || id || insetNameId ? undefined : locale.input)}
                    aria-labelledby={ariaLabelledby ?? (ariaLabel ? undefined : insetNameId)}
                    aria-required={ariaRequired}
                    role={role}
                    tabIndex={tabIndex}
                    disabled={disabled}
                    placeholder={tagsArray.length === 0 ? placeholder : ''}
                    value={inputValue}
                    // the wrapper draws the label, clear button and suffix: global Input defaults must not add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    size={size}
                    prefix={null}
                    suffix={null}
                    onChange={(v, e) => foundation.handleInputChange(v, e)}
                    onCompositionEnd={foundation.handleInputCompositionEnd}
                    onCompositionStart={foundation.handleInputCompositionStart}
                    onKeyDown={foundation.handleKeyDown}
                />
            </div>
            {clearNode}
            {suffixNode}
        </div>
    );
}
