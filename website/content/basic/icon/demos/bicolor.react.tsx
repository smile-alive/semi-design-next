import { IconAIWandLevel2, IconAIFilledLevel2 } from '@fibrae/semi-icons-react';

export default function IconDemo() {
    return (
        <div>
            <IconAIWandLevel2 fill={['var(--semi-color-danger)', 'var(--semi-color-success)']} style={{ marginRight: 10 }} size="extra-large" />
            <IconAIFilledLevel2 fill="var(--semi-color-success)" size="extra-large" />
        </div>
    );
}
