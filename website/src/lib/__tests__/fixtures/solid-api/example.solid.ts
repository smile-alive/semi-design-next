import { type JSX, type Ref, mergeProps } from 'solid-js';

const strings = { SIZE: 'small' } as const;

export interface ExampleHandle {
    focus: () => void;
    reset(value: string): void;
}

export interface ExampleProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'ref'> {
    label?: string;
    size?: 'small' | 'large';
    onChange: (value: string) => void;
    ref?: Ref<HTMLDivElement & ExampleHandle>;
}

const defaultProps = { label: '名称', size: strings.SIZE } satisfies Partial<ExampleProps>;

// The generator reads only the signature and the module's defaultProps
export default function Example(_props: ExampleProps) {
    return defaultProps;
}

export interface ExampleItemProps {
    name?: string;
    editable?: boolean;
}

const itemDefaults = { editable: true } satisfies Partial<ExampleItemProps>;

export function ExampleItem(rawProps: ExampleItemProps) {
    return mergeProps(itemDefaults, rawProps);
}
