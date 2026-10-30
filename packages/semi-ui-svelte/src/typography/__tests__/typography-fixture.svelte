<script lang="ts">
    import { Typography, TypographyNumeral, TypographyParagraph, TypographyText, TypographyTitle } from '../index';

    interface Store {
        kind?: 'text' | 'title' | 'paragraph' | 'numeral' | 'typography';
        text?: string;
        // props of the component under test: snippets, callbacks and plain values
        props?: Record<string, unknown>;
    }

    const { store }: { store: Store } = $props();

    const components = { text: TypographyText, title: TypographyTitle, paragraph: TypographyParagraph, numeral: TypographyNumeral, typography: Typography };
    const Component = $derived(components[store.kind ?? 'text']) as typeof TypographyText;
</script>

<Component {...store.props}>{store.text}</Component>
