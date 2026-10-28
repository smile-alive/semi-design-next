import { createSignal, For } from 'solid-js';
import { IconAlertTriangle } from '@fibrae/semi-icons-solid';
import { Button, Popconfirm, Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

type TypeKey = 'default' | 'warning' | 'danger' | 'tertiary';

const keys: TypeKey[] = ['default', 'warning', 'danger', 'tertiary'];

// The default icon keeps its theme color, so no color is set for it
const iconColors: Record<TypeKey, string | undefined> = {
    default: undefined,
    warning: 'var(--semi-color-warning)',
    danger: 'var(--semi-color-danger)',
    tertiary: 'var(--semi-color-tertiary)',
};

export default function PopconfirmDemo() {
    const [type, setType] = createSignal<TypeKey>('default');
    const [visible, setVisible] = createSignal(true);

    const changeType = (event: RadioChangeEvent) => {
        const key = keys.find((item) => item === event.target.value);
        if (key) {
            setType(key);
        }
    };

    return (
        <div>
            <RadioGroup type="button" onChange={changeType} value={type()} style={{ 'margin-top': '14px', 'margin-bottom': '14px' }}>
                <For each={keys}>
                    {(key) => (
                        <Radio value={key}>
                            <span style={{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }}>{key}</span>
                        </Radio>
                    )}
                </For>
            </RadioGroup>
            <div>
                <Popconfirm visible={visible()} onVisibleChange={(value) => setVisible(value)} trigger="custom" okType={type() === 'danger' ? 'danger' : 'primary'} icon={<IconAlertTriangle size="extra-large" style={{ color: iconColors[type()] }} />} title="确定是否要保存此修改？" content="此修改将不可逆">
                    {(trigger) => (
                        <Button {...trigger()} onClick={() => setVisible(!visible())}>
                            点击此处
                        </Button>
                    )}
                </Popconfirm>
            </div>
        </div>
    );
}
