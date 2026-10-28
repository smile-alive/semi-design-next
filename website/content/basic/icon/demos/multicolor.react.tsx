import { IconAIBellLevel3, IconAIWandLevel3, IconAIFilledLevel3 } from '@fibrae/semi-icons-react';

export default function IconDemo() {
    return (
        <div>
            <IconAIBellLevel3 style={{ marginRight: 10 }} size="extra-large" />
            <IconAIWandLevel3 fill={['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)']} style={{ marginRight: 10 }} size="extra-large" />
            <IconAIFilledLevel3 fill={['var(--semi-color-primary)', 'var(--semi-color-success)']} size="extra-large" />
        </div>
    );
}
