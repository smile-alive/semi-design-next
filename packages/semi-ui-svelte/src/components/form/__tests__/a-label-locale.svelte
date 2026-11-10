<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Label from '../label.svelte';
</script>

<LocaleProvider locale={en_US}>
    <Label optional text="name" />
</LocaleProvider>
