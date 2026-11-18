<script lang="ts">
    import { Radio, RadioGroup, Space, Typography } from '@fibrae/semi-ui-svelte';
    import { useThemeMode, type ThemePreference } from '@fibrae/semi-ui-svelte/hooks';

    const theme = useThemeMode();
</script>

<Space spacing="loose">
    <RadioGroup aria-label="主题模式" onChange={(e) => theme.setMode(e.target.value as ThemePreference)} type="button" value={theme.preference}>
        <Radio value="light">亮色</Radio>
        <Radio value="dark">暗色</Radio>
        <Radio value="system">跟随系统</Radio>
    </RadioGroup>
    <Typography.Text>当前显示：{theme.mode === 'dark' ? '暗色' : '亮色'}</Typography.Text>
</Space>
