<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import type { UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    let { locale, steps, current, mode }: { locale: Locale; steps: UserGuideStepItem[]; current?: number; mode?: 'popup' | 'modal' } = $props();
</script>

<LocaleProvider {locale}>
    <UserGuide {current} {mode} {steps} visible />
</LocaleProvider>
