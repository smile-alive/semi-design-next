<script lang="ts">
    import { TypographyNumeral, TypographyParagraph, TypographyText, TypographyTitle } from '../index';

    interface Props {
        kind: 'text' | 'title' | 'paragraph' | 'numeral';
        text: string;
        props?: Record<string, unknown>;
    }

    const { kind, text, props = {} }: Props = $props();
</script>

{#snippet icon()}<i>*</i>{/snippet}

{#if kind === 'text'}
    <TypographyText {...props} {icon}>{text}</TypographyText>
{:else if kind === 'numeral'}
    <TypographyNumeral {...props} {icon}>{text}</TypographyNumeral>
{:else if kind === 'title'}
    <TypographyTitle {...props}>{text}</TypographyTitle>
{:else}
    <TypographyParagraph {...props}>{text}</TypographyParagraph>
{/if}
