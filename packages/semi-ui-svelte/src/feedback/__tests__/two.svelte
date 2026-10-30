<script lang="ts">
    import Feedback from '../feedback.svelte';

    let { onFirst, onSecond }: { onFirst: (value: unknown) => void; onSecond: (value: unknown) => void } = $props();
</script>

<Feedback onValueChange={onFirst} title="First" visible />
<Feedback onValueChange={onSecond} title="Second" visible />
