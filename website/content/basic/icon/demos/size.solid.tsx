import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh, type IconSize } from '@fibrae/semi-icons-solid';

const icons = [IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh];
const sizes: IconSize[] = ['extra-small', 'small', 'default', 'large', 'extra-large'];

export default function IconDemo() {
    return (
        <For each={icons}>
            {(icon) => (
                <div style={{ 'margin-bottom': '4px' }}>
                    <For each={sizes}>{(size) => <Dynamic component={icon} size={size} />}</For>
                </div>
            )}
        </For>
    );
}
