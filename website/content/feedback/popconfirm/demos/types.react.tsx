import { useState } from 'react';
import { IconAlertTriangle } from '@fibrae/semi-icons-react';
import { Popconfirm, Radio, RadioGroup, Button, type RadioChangeEvent } from '@fibrae/semi-ui-react';

type TypeKey = 'default' | 'warning' | 'danger' | 'tertiary';

const typeMap: Record<TypeKey, { okType?: 'danger'; color?: string }> = {
    default: {},
    warning: { color: 'var(--semi-color-warning)' },
    danger: { okType: 'danger', color: 'var(--semi-color-danger)' },
    tertiary: { color: 'var(--semi-color-tertiary)' },
};
const keys = Object.keys(typeMap) as TypeKey[];

export default function PopconfirmDemo() {
    const [type, setType] = useState<TypeKey>('default');
    const [visible, setVisible] = useState(true);

    const changeType = (e: RadioChangeEvent) => {
        const key = keys.find((item) => item === e.target.value);
        if (key) {
            setType(key);
        }
    };

    return (
        <div>
            <RadioGroup type="button" onChange={changeType} value={type} style={{ marginBlockStart: 14, marginBlockEnd: 14 }}>
                {keys.map((key) => (
                    <Radio key={key} value={key}>
                        <span style={{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }}>{key}</span>
                    </Radio>
                ))}
            </RadioGroup>
            <div>
                <Popconfirm visible={visible} onVisibleChange={setVisible} trigger="custom" okType={typeMap[type].okType} icon={<IconAlertTriangle size="extra-large" style={{ color: typeMap[type].color }} />} title="确定是否要保存此修改？" content="此修改将不可逆">
                    <Button onClick={() => setVisible(!visible)}>点击此处</Button>
                </Popconfirm>
            </div>
        </div>
    );
}
