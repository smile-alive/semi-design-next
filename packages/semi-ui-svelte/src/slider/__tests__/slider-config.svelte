<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { SliderProps } from '../interface';
    import Slider from '../slider.svelte';

    let { props, direction, locale }: { props: SliderProps; direction?: 'ltr' | 'rtl'; locale?: Locale } = $props();
</script>

<ConfigProvider {direction} {locale}>
    <Slider {...props} />
</ConfigProvider>
