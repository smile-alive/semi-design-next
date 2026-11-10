<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import { LocaleProvider } from '../../locale';
    import { List } from '../index';
</script>

<LocaleProvider locale={en_US}>
    <List dataSource={[]} />
</LocaleProvider>
