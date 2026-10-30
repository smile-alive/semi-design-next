<script lang="ts">
    import { Avatar } from '@fibrae/semi-ui-svelte';

    const src = '/assets/placeholder/avatar-a.svg';
</script>

<div>
    <Avatar alt="漂亮的猫咪" {src} style="margin: 4px" />
    <Avatar alt="可爱的猫咪" size="small" {src} style="margin: 4px" />
</div>
