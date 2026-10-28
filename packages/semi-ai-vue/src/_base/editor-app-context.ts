import { type AppContext, type ShallowRef, watch } from 'vue';
import type { Editor } from '@tiptap/vue-3';

let nodeViews = 0;

/**
 * Gives every node view of the editor its own useId prefix. tiptap renders each node view as a separate Vue root
 * under `editor.appContext`, and useId numbers components per root under the app's idPrefix, so without this the
 * node views repeat the ids of the app and of each other (an aria-controls in one points into another).
 *
 * The editor's appContext becomes an accessor: the setter keeps what EditorContent assigns, the getter hands every
 * read a copy whose config carries a fresh idPrefix. `provides` is passed on as is, because Vue resolves injections
 * through its prototype chain; node views therefore still see the providers around EditorContent.
 *
 * Relies on @tiptap/vue-3 internals (3.31): EditorContent assigns `editor.appContext` and calls `createNodeViews()`
 * in the same nextTick callback, and VueRenderer reads `editor.appContext` on every render. A later read for an
 * existing node view only patches it, so its ids stay as first generated. Re-check the node view id test whenever
 * @tiptap/vue-3 is upgraded; drop this once tiptap scopes node view roots itself.
 */
export default function useEditorAppContext(editor: Readonly<ShallowRef<Editor | undefined>>) {
    // Sync: the accessor must be in place before EditorContent's nextTick writes the context; the vue-3 Editor
    // constructor assigns `appContext = null`, so it can only be installed on the constructed instance
    watch(
        editor,
        (value) => {
            if (!value) {
                return;
            }
            let context: AppContext | null = value.appContext;
            Object.defineProperty(value, 'appContext', {
                configurable: true,
                enumerable: true,
                get(): AppContext | null {
                    if (!context) {
                        return null;
                    }
                    nodeViews += 1;
                    // Prototype, not a spread: the dev build's compilerOptions getter warns on read
                    return {
                        ...context,
                        config: Object.create(context.config, {
                            idPrefix: { value: `${context.config.idPrefix ?? 'v'}-node${nodeViews}`, enumerable: true },
                        }),
                    };
                },
                set(next: AppContext | null) {
                    context = next;
                },
            });
        },
        { flush: 'sync', immediate: true }
    );
}
