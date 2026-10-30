import type { Attachment } from 'svelte/attachments';

/**
 * Moves the element into `target` once it mounts and removes it on teardown.
 *
 * Svelte removes a block's DOM by walking `nextSibling` from its first to its last node, so the moved element must be
 * the only node of its block (`{#if open}<div {@attach teleport(target)}>...</div>{/if}`): as a block's sole node it is
 * still removed wherever it sits, while as an edge of a longer range the walk would continue into the target's
 * children. An enclosing block removed as a whole skips its children's DOM, which no longer contains the moved
 * element, so the teardown removes it; after an outro the block already did, and `remove()` is a no-op.
 */
export default function teleport(target: Element | ShadowRoot): Attachment<HTMLElement> {
    return (node) => {
        target.append(node);
        return () => node.remove();
    };
}
