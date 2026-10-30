<script lang="ts">
    import type { ImageProps } from '../../image';
    import { img as DefaultImg } from '../components';

    const props: ImageProps = $props();
</script>

<DefaultImg {...props} preview />
