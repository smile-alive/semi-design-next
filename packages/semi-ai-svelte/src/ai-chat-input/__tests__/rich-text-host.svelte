<script lang="ts">
    import type { Editor, Extensions } from '@tiptap/core';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '@fibrae/semi-ui-svelte/locale/locale-provider.svelte';
    import type { PlaceholderProps } from '../interface';
    import RichTextInput from '../rich-text-input.svelte';

    interface Store {
        locale?: Locale;
        id: string;
        controls?: string;
        activeDescendant?: string;
        placeholder?: PlaceholderProps;
        defaultContent?: string;
        extensions?: Extensions;
        log: string[];
        editor?: Editor;
    }

    let { store }: { store: Store } = $props();
</script>

<LocaleProvider locale={store.locale}>
    <RichTextInput
        activeDescendant={store.activeDescendant}
        controls={store.controls}
        defaultContent={store.defaultContent}
        extensions={store.extensions}
        handleKeyDown={() => false}
        id={store.id}
        onBlur={() => store.log.push('blur')}
        onChange={(text) => store.log.push(`change ${text}`)}
        onCreate={() => store.log.push('create')}
        onFocus={() => store.log.push('focus')}
        onKeyDown={() => store.log.push('keydown')}
        onPasteFiles={(files) => store.log.push(`files ${files.length}`)}
        onReady={(editor) => {
            store.editor = editor;
            store.log.push('ready');
        }}
        placeholder={store.placeholder}
    />
</LocaleProvider>
