<script lang="ts">
    import { Button, Image } from '@fibrae/semi-ui-svelte';

    let timestamp = $state('');
</script>

<Image alt="Abstract colorful artwork" height={200} src="/assets/root-web-sites/abstract-big.png?{timestamp}" width={300}>
    {#snippet placeholder()}
        <Image alt="" height={200} preview={false} src="/assets/root-web-sites/abstract-small.jpeg" width={300} />
    {/snippet}
</Image>
<br />
<Button style="margin-top: 10px" theme="solid" onclick={() => (timestamp = String(Date.now()))}>Reload</Button>
