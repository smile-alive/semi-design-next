<script lang="ts">
    import Cropper from '../cropper.svelte';
    import type { CropperProps } from '../interface';

    let { props }: { props: CropperProps } = $props();
</script>

<Cropper {...props} />
