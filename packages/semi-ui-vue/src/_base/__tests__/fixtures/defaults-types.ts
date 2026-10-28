export interface DefaultsProps {
    label?: string;
    disabled?: boolean;
    filter?: boolean | ((value: string) => string);
}

declare module '../../../_utils/semi-global' {
    interface OverrideDefaultProps {
        Fixture?: DefaultsProps;
    }
}
