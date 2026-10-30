<script lang="ts">
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Label from '../label.svelte';
</script>

<LocaleProvider locale={ja_JP}>
    <Label optional text="name" />
</LocaleProvider>
