import { isServer } from 'solid-js/web';

/**
 * Whether resolved JSX content is rendered markup rather than text or data: a DOM node in the browser, the `{ t }`
 * object Solid's server `ssr()` returns on the server. The server shape is Solid's internal one; a Solid upgrade that
 * changes it fails the SSR tests.
 */
export default function isMarkup(value: unknown) {
    return isServer ? typeof value === 'object' && value !== null && typeof (value as { t?: unknown }).t === 'string' : value instanceof Node;
}

/** The HTML string of server markup, from which the server reads what the browser reads off the element */
export function serverHtml(value: unknown) {
    return isServer && isMarkup(value) ? (value as { t: string }).t : undefined;
}
