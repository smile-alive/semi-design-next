import { type Component, createComponent, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

type ElementType = string | Component<any>;

const ELEMENT = Symbol('MarkdownRender element');

/**
 * An element of compiled markdown, created only when called. The compiled code builds children before their parent,
 * so creating them right away would put them outside the parent's owner and context (the link around an image).
 */
export interface MarkdownElement {
    (): JSX.Element;
    readonly [ELEMENT]: true;
    readonly type: ElementType;
    readonly props: Record<string, unknown>;
}

export function isMarkdownElement(value: unknown): value is MarkdownElement {
    return typeof value === 'function' && ELEMENT in value;
}

function containsElement(value: unknown) {
    return isMarkdownElement(value) || (Array.isArray(value) && value.some(containsElement));
}

/** Creates the nodes of compiled content where it is read, as reading a JSX prop does */
export function renderMarkdownNode(value: unknown): JSX.Element {
    if (isMarkdownElement(value)) {
        return value();
    }
    return Array.isArray(value) ? value.map(renderMarkdownNode) : (value as JSX.Element);
}

let readingData = false;

/**
 * Reads an element-valued prop of compiled content (`() => props.children`) as data rather than nodes. A flag, not a
 * prop or a WeakMap key: the read passes through the getters of any spread around the component
 * (`<Default {...props} />`). Known limit: content that is not compiled markdown comes back as created nodes; tag it
 * when it is created if a reader such as MarkdownTable has to accept children written outside compiled markdown.
 */
export function readMarkdownData(read: () => unknown): unknown {
    readingData = true;
    try {
        return read();
    } finally {
        readingData = false;
    }
}

function create(type: ElementType, { className, ...rest }: Record<string, unknown>) {
    // an element-valued prop is a getter that creates its nodes on each read, as in the props Solid compiles: a
    // component with function children (Tooltip) would otherwise call an element as its render function
    const live: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
        if (containsElement(value)) {
            Object.defineProperty(live, key, { enumerable: true, get: () => (readingData ? value : renderMarkdownNode(value)) });
        } else {
            live[key] = value;
        }
    }
    // MDX authors write React's className; Solid components read class
    if (className !== undefined) {
        live.class = rest.class === undefined ? className : `${rest.class} ${className}`;
    }
    if (typeof type === 'string') {
        live.component = type;
        return createComponent(Dynamic, live as Parameters<typeof Dynamic>[0]);
    }
    return createComponent(type, live);
}

export function Fragment(props: { children?: JSX.Element }) {
    return <>{props.children}</>;
}

function jsx(type: ElementType, props: Record<string, unknown>): MarkdownElement {
    return Object.assign(() => create(type, props), { [ELEMENT]: true as const, type, props });
}

let nextId = 0;
const ids = new WeakMap<object, number>();

// the NUL prefix keeps an identity apart from a number or string an MDX expression passes
function idOf(value: object) {
    let id = ids.get(value);
    if (id === undefined) {
        id = nextId++;
        ids.set(value, id);
    }
    return `\0${id}`;
}

// JSON keeps only the own enumerable fields, so a Map, Set or class instance would serialize as `{}` whatever it holds
function isPlainData(value: object) {
    const prototype: unknown = Object.getPrototypeOf(value);
    return Array.isArray(value) || prototype === Object.prototype || prototype === null;
}

/**
 * Equal for nodes built from the same source with the same components, so content a new compile left unchanged can
 * keep its DOM. Undefined when the props cannot be serialized (a cycle or a BigInt from an MDX expression).
 */
export function markdownNodeKey(node: unknown) {
    try {
        return JSON.stringify(node, (_, value: unknown) => {
            if (isMarkdownElement(value)) {
                return [typeof value.type === 'string' ? value.type : idOf(value.type), value.props];
            }
            if (typeof value === 'function' || (typeof value === 'object' && value !== null && !isPlainData(value))) {
                return idOf(value);
            }
            return value;
        });
    } catch {
        return undefined;
    }
}

// read by both the md pipeline (hast-util-to-jsx-runtime) and @mdx-js/mdx: Solid sets `class` and `for`, and an
// object style goes through setProperty, which takes only kebab-case names
export default { Fragment, jsx, jsxs: jsx, elementAttributeNameCase: 'html', stylePropertyNameCase: 'css' } as const;
