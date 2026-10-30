<script lang="ts">
    import { Button, ImagePreview } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

    let visible1 = $state(false);
    let visible2 = $state(false);
</script>

<Button onclick={() => (visible1 = true)}>Preview single Image</Button>
<ImagePreview bind:visible={visible1} src="/assets/root-web-sites/sky.jpg" />
<br />
<Button style="margin-top: 20px" onclick={() => (visible2 = true)}>Preview multiple Images</Button>
<ImagePreview bind:visible={visible2} previewTitle="Scenery" src={srcList} />
