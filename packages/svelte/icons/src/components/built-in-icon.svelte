<script lang="ts" module>
    import type { IconProps } from './icon.svelte';

    export type SemiIconProps = Omit<IconProps, 'type' | 'children'>;
</script>

<script lang="ts">
    import type { IconData } from '@fibrae/semi-icons-core';
    import { defaultAttrs } from '@fibrae/semi-icons-core/utils';
    import Icon from './icon.svelte';
    import Svg from './svg.svelte';

    let { data, ...rest }: SemiIconProps & { data: IconData } = $props();

    const svgData = $derived({ ...data, attrs: { ...data.attrs, ...defaultAttrs } });
</script>

<Icon {...rest} type={data.name}>
    {#snippet children({ fill })}
        <Svg data={svgData} {fill} />
    {/snippet}
</Icon>
