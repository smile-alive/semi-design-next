import { useState } from 'react';
import { IconAlertTriangle } from '@fibrae/semi-icons-react';
import { Popconfirm, Radio, RadioGroup, Button, type RadioChangeEvent } from '@fibrae/semi-ui-react';

export default function PopconfirmDemo() {
    const typeMap = {
        default: {
            icon: <IconAlertTriangle size="extra-large" />,
        },
        warning: {
            icon: <IconAlertTriangle style={{ color: 'var(--semi-color-warning)' }} size="extra-large" />,
        },
        danger: {
            okType: 'danger' as const,
            icon: <IconAlertTriangle style={{ color: 'var(--semi-color-danger)' }} size="extra-large" />,
        },
        tertiary: {
            icon: <IconAlertTriangle style={{ color: 'var(--semi-color-tertiary)' }} size="extra-large" />,
        },
    };

    type TypeKey = keyof typeof typeMap;
    const keys = Object.keys(typeMap) as TypeKey[];
    const [type, setType] = useState<TypeKey>('default');
    const [visible, setVisible] = useState(true);

    const changeType = (e: RadioChangeEvent) => {
        const type = e && e.target && e.target.value;
        if (type && keys.includes(type)) {
            setType(type);
        }
    };

    return (
        <div>
            <RadioGroup type="button" onChange={changeType} value={type} style={{ marginTop: 14, marginBottom: 14 }}>
                {keys.map((key) => (
                    <Radio key={key} value={key}>
                        <span style={{ color: `var(--semi-color-${key === 'default' ? 'primary' : key})` }}>{key}</span>
                    </Radio>
                ))}
            </RadioGroup>
            <div>
                <Popconfirm {...typeMap[type]} visible={visible} onVisibleChange={setVisible} trigger="custom" title="确定是否要保存此修改？" content="此修改将不可逆">
                    <Button onClick={() => setVisible(!visible)}>点击此处</Button>
                </Popconfirm>
            </div>
        </div>
    );
}
