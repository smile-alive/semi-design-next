<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { Button, type ButtonProps } from '@fibrae/semi-ui-svelte/button/index';

    interface ToggleButtonProps extends Omit<ButtonProps, 'onclick' | 'value'> {
        /** Whether the button is pressed */
        value?: boolean;
        onChange: (value: boolean) => void;
        /** The value after the toggle */
        onClick?: (value: boolean) => void;
    }

    let { value = false, class: className, onChange, onClick, ...rest }: ToggleButtonProps = $props();

    const prefix = cssClasses.PREFIX;

    const toggle = () => {
        const next = !value;
        onChange(next);
        onClick?.(next);
    };
</script>

<Button theme="outline" type="tertiary" {...rest} aria-pressed={value} class={[`${prefix}-footer-configure-button`, className, { [`${prefix}-footer-configure-button-active`]: value }]} onclick={toggle} />
