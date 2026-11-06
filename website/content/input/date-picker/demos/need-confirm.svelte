<script lang="ts">
    import { DatePicker } from '@fibrae/semi-ui-svelte';
</script>

<DatePicker needConfirm onCancel={(...args) => console.log('Canceled: ', ...args)} onChange={(...args) => console.log('Changed: ', ...args)} onConfirm={(...args) => console.log('Confirmed: ', ...args)} type="dateTime" />
