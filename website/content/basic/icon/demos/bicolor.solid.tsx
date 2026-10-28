import { IconAIWandLevel2, IconAIFilledLevel2 } from '@fibrae/semi-icons-solid';

export default function IconDemo() {
    return (
        <div>
            <IconAIWandLevel2 fill={['var(--semi-color-danger)', 'var(--semi-color-success)']} style={{ 'margin-right': '10px' }} size="extra-large" />
            <IconAIFilledLevel2 fill="var(--semi-color-success)" size="extra-large" />
        </div>
    );
}
