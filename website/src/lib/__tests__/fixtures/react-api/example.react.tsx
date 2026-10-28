import type React from 'react';
import { memo } from 'react';

const strings = { SIZE: 'small' } as const;

const noop = () => {};

export interface ExampleHandle {
    focus: () => void;
    reset(value: string): void;
}

export interface ExampleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    label?: string;
    max?: number;
    size?: 'small' | 'large';
    onChange?: (value: string) => void;
    ref?: React.Ref<ExampleHandle>;
}

const baseDefaults = { max: Infinity } satisfies Partial<ExampleProps>;

const defaultProps = { ...baseDefaults, label: '名称', size: strings.SIZE, onChange: noop } satisfies Partial<ExampleProps>;

// The generator finds the call by name, so the fixture needs no real implementation
function useDefaultProps<P extends object>(_name: string, props: P, defaults: Partial<P>) {
    return { ...defaults, ...props };
}

function Example(rawProps: ExampleProps) {
    const props = useDefaultProps('Example', rawProps, defaultProps);
    return <div>{props.label}</div>;
}

export default Object.assign(memo(Example), { elementType: 'Example' });

const baseStrings = { SIZES: ['small', 'large'] };

const listStrings = { ...baseStrings };

export interface ExampleListProps {
    sizes?: string[];
}

export function ExampleList({ sizes = listStrings.SIZES }: ExampleListProps) {
    return <div>{sizes.join()}</div>;
}

export interface ExampleItemProps {
    name?: string;
    editable?: boolean;
}

export function ExampleItem({ name, editable = true }: ExampleItemProps) {
    // Reads the group's defaults, which are not the item's own
    const group = useDefaultProps<{ disabled?: boolean; editable?: boolean }>('ExampleGroup', {}, { disabled: false, editable: false });
    return <span aria-disabled={group.disabled}>{editable ? name : null}</span>;
}
