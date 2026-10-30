<script lang="ts">
    import { Modal } from '../../modal';
    import type { UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    let { steps, guide, modal }: { steps: UserGuideStepItem[]; guide: boolean; modal: boolean } = $props();
</script>

<UserGuide {steps} visible={guide} />
<Modal motion={false} title="Dialog" visible={modal} />
