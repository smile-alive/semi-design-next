import React from 'react';
import clsx from 'clsx';
import { isEqualWith } from 'es-toolkit';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import elementTypeOf from '../_base/element-type';
/** `noImmediate` skips stopImmediatePropagation on the native event */
export function stopPropagation(e: React.MouseEvent | React.FocusEvent<HTMLElement>, noImmediate?: boolean) {
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
    }

    if (!noImmediate && e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
    }
}

/** Deep clone that keeps functions, React elements and errors as they are */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, React.isValidElement);
}

/**
 * An `isEqualWith` customizer that compares React elements by type, key and props: a plain deep compare would also
 * walk the dev-only `_owner` fiber, and with it the component tree
 */
export function isSameNode(a: unknown, b: unknown): boolean | undefined {
    if (React.isValidElement(a) && React.isValidElement(b)) {
        return a.type === b.type && a.key === b.key && isEqualWith(a.props, b.props, isSameNode);
    }
    return undefined;
}

/** Whether the element is a built-in Semi icon */
export function isSemiIcon(icon: unknown): icon is React.ReactElement<{ size?: string }> {
    return elementTypeOf(icon) === 'Icon';
}

/** Whether a slot renders anything: React renders nothing for null, undefined, booleans and '', but does render 0 */
export function hasContent(node: React.ReactNode) {
    return node != null && typeof node !== 'boolean' && node !== '';
}

/** Whether a slot is plain text, which takes the `-text` class: a number reads like a string */
export function isText(node: React.ReactNode): node is string | number {
    return typeof node === 'string' || typeof node === 'number';
}

/** The prefix or inset label of a Select-like trigger; `id` lets the combobox name itself by the inset label */
export function renderTriggerPrefix(prefixcls: string, prefix: React.ReactNode, insetLabel: React.ReactNode, id?: string) {
    const labelNode = hasContent(prefix) ? prefix : insetLabel;
    const cls = clsx({
        [`${prefixcls}-prefix`]: true,
        [`${prefixcls}-inset-label`]: hasContent(insetLabel),
        [`${prefixcls}-prefix-text`]: isText(labelNode),
        [`${prefixcls}-prefix-icon`]: isSemiIcon(labelNode),
    });
    return (
        <div id={id} className={cls} x-semi-prop="prefix,insetLabel">
            {labelNode}
        </div>
    );
}

/** The suffix of a Select-like trigger */
export function renderTriggerSuffix(prefixcls: string, suffix: React.ReactNode) {
    const cls = clsx({
        [`${prefixcls}-suffix`]: true,
        [`${prefixcls}-suffix-text`]: isText(suffix),
        [`${prefixcls}-suffix-icon`]: isSemiIcon(suffix),
    });
    return (
        <div className={cls} x-semi-prop="suffix">
            {suffix}
        </div>
    );
}
