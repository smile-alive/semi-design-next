<script lang="ts">
    import { IconSemiLogo } from '@fibrae/semi-icons-svelte';
    import { Divider } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Divider align="left" margin="12px">这是居左文字</Divider>

    <Divider align="center" margin="12px">这是居中文字</Divider>

    <Divider align="right" margin="12px">这是居右文字</Divider>

    <Divider margin="12px">
        <IconSemiLogo />
    </Divider>
</div>
