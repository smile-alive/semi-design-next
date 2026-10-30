<script lang="ts">
    import FormatNumeral from '@fibrae/semi-foundation/typography/format-numeral';
    import TypographyBase from './base.svelte';
    import type { TypographyNumeralProps } from './interface.js';

    // A static subcomponent: it reads no global defaults, as in React.
    const { parser, precision = 0, rule = 'text', truncate = 'round', ...props }: TypographyNumeralProps = $props();

    const format = $derived((value: string) => new FormatNumeral(value, rule, precision, truncate, parser).format());
</script>

<TypographyBase {...props} component={props.component ?? 'span'} {format} />
