import { IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh, type IconSize } from '@fibrae/semi-icons-react';

const icons = [IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh];
const sizes: IconSize[] = ['extra-small', 'small', 'default', 'large', 'extra-large'];

export default function IconDemo() {
    return (
        <>
            {icons.map((Icon, index) => (
                <div key={index} style={{ marginBlockEnd: 4 }}>
                    {sizes.map((size) => (
                        <Icon key={size} size={size} />
                    ))}
                </div>
            ))}
        </>
    );
}
