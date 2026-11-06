import { createSignal, For } from 'solid-js';
import { IconAlertTriangle } from '@fibrae/semi-icons-solid';
import { Button, Popconfirm, Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

type TypeKey = 'default' | 'warning' | 'danger' | 'tertiary';

const typeMap: Record<TypeKey, { okType?: 'danger'; color?: string }> = {
    default: {},
    warning: { color: 'var(--semi-color-warning)' },
    danger: { okType: 'danger', color: 'var(--semi-color-danger)' },
    tertiary: { color: 'var(--semi-color-tertiary)' },
};
const keys = Object.keys(typeMap) as TypeKey[];

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
            <RadioGroup type="button" onChange={changeType} value={type()} style={{ 'margin-block-start': '14px', 'margin-block-end': '14px' }}>
                <For each={keys}>
                    {(key) => (
                        <Radio value={key}>
                            <span style={{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }}>{key}</span>
                        </Radio>
                    )}
                </For>
            </RadioGroup>
            <div>
                <Popconfirm visible={visible()} onVisibleChange={(value) => setVisible(value)} trigger="custom" okType={typeMap[type()].okType} icon={<IconAlertTriangle size="extra-large" style={{ color: typeMap[type()].color }} />} title="确定是否要保存此修改？" content="此修改将不可逆">
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
