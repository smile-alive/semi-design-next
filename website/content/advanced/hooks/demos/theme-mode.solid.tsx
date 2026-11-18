import { Radio, RadioGroup, Space, Typography } from '@fibrae/semi-ui-solid';
import { useThemeMode, type ThemePreference } from '@fibrae/semi-ui-solid/primitives';

export default function ThemeModeDemo() {
    const { mode, preference, setMode } = useThemeMode();

    return (
        <Space spacing="loose">
            <RadioGroup type="button" value={preference()} aria-label="主题模式" onChange={(e) => setMode(e.target.value as ThemePreference)}>
                <Radio value="light">亮色</Radio>
                <Radio value="dark">暗色</Radio>
                <Radio value="system">跟随系统</Radio>
            </RadioGroup>
            <Typography.Text>当前显示：{mode() === 'dark' ? '暗色' : '亮色'}</Typography.Text>
        </Space>
    );
}
