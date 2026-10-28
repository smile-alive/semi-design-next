import type { JSX } from 'solid-js';

/**
 * Native attributes of the element that receives undeclared props (F6). `Omit` lists the props the component
 * redefines with an incompatible signature; the Props interface must `extends` this type so a missing key fails with
 * TS2430 instead of merging two signatures.
 */
export type ElementProps<T extends keyof JSX.IntrinsicElements, K extends PropertyKey = never> = Omit<JSX.IntrinsicElements[T], K>;
