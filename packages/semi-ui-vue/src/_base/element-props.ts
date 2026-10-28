import type { IntrinsicElementAttributes } from 'vue';

// Vue types an input's autocomplete as the AutoFill template-literal union; withDefaults distributes over it and fails
// with TS2590 (union too complex), so it is widened to the string the DOM accepts.
type Attributes<E extends keyof IntrinsicElementAttributes> = 'autocomplete' extends keyof IntrinsicElementAttributes[E] ? Omit<IntrinsicElementAttributes[E], 'autocomplete'> & { autocomplete?: string } : IntrinsicElementAttributes[E];

// Native attributes of the element that receives the fallthrough attrs, intersected into defineProps behind a
// `@vue-ignore` comment: compiler-sfc skips that member, so they stay attrs at runtime and only TSX call sites see them.
// Omitted lists the component's own props and emit handlers so those win on name clashes.
export type ElementProps<E extends keyof IntrinsicElementAttributes, Omitted extends PropertyKey = never> = Omit<Attributes<E>, Omitted>;

// Vue derives an onXxx prop from every emit; a native handler of the same name would intersect with it and reject the emit's own signature.
export type EmitHandlers<Emits> = `on${Capitalize<keyof Emits & string>}`;

/** The `onXxx` props a template listener checks against, from an emits declaration */
export type EmitProps<Emits> = { [K in keyof Emits & string as `on${Capitalize<K>}`]?: (...args: Extract<Emits[K], unknown[]>) => void };
