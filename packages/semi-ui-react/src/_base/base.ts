export type { ArrayElement } from '@fibrae/semi-foundation/utils/type';

/**
 * Native attributes of the element that receives a component's undeclared props (F2, F6). `Omitted` lists the names
 * the component redefines with an incompatible type; a missing entry fails the `extends` check instead of passing
 * silently, and a name the element does not have fails the constraint.
 */
export type ElementProps<E extends keyof React.JSX.IntrinsicElements, Omitted extends keyof React.ComponentPropsWithoutRef<E> = never> = Omit<React.ComponentPropsWithoutRef<E>, Omitted>;

export type Motion = boolean;

/**
 * `Single` or `Many`, following a component's `multiple` type parameter. `true extends Multiple` rather than
 * `Multiple extends true`: without strictNullChecks undefined extends true. The outer conditional distributes, so a
 * `boolean` multiple gives both.
 */
export type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

/**
 * A callback type whose parameters are checked bivariantly, the device React's own event handler types use. A
 * component body that serves every `multiple` mode reads its props through one wide type; with these callbacks each
 * mode's narrower props type is assignable to it, so no cast is needed.
 */
export type Bivariant<Args extends unknown[], R = void> = { callback(...args: Args): R }['callback'];
