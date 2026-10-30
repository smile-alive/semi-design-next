<script lang="ts">
    import { IconAIBellLevel1, IconAIEditLevel1, IconAIEditLevel2, IconAIFileLevel3, IconAIFilledLevel1, IconAIFilledLevel3, IconAIImageLevel3, IconAILoading, IconAISearchLevel3, IconAIStrokedLevel3, IconAIWandLevel3 } from '@fibrae/semi-icons-svelte';
    import { Button, FloatButton, Tag, TypographyTitle } from '@fibrae/semi-ui-svelte';

    const wandFill = ['var(--semi-color-danger)', 'var(--semi-color-success)', 'var(--semi-color-primary)', 'var(--semi-color-warning)'];
    const swatchCount = Array.from({ length: 10 }, (_, index) => index);
    const colorStyle = (color: string) => `width: 40px; height: 40px; background: ${color}; border-radius: 50%`;
    const grid = 'display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 10px; width: fit-content';
</script>

{#snippet level1()}
    <IconAIFilledLevel1 />
{/snippet}
{#snippet level3()}
    <IconAIFilledLevel3 />
{/snippet}
{#snippet tagLevel1()}
    <IconAIFilledLevel1 size="small" />
{/snippet}
{#snippet tagLevel3()}
    <IconAIFilledLevel3 size="small" />
{/snippet}
{#snippet editLevel1()}
    <IconAIEditLevel1 />
{/snippet}

<div style="display: flex; flex-direction: column; row-gap: 20px">
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <TypographyTitle heading={5}>AI Token</TypographyTitle>
        <div style="display: flex; align-items: center; column-gap: 10px">
            <span>Purple</span>
            <div style="display: inline-flex; column-gap: 4px">
                {#each swatchCount as index (index)}
                    <div style={colorStyle(`var(--semi-ai-purple-${index})`)}></div>
                {/each}
            </div>
        </div>
        <div style="display: flex; align-items: center; column-gap: 10px">
            <span>General</span>
            <div style="display: inline-flex; column-gap: 4px">
                {#each swatchCount as index (index)}
                    <div style={colorStyle(`var(--semi-ai-general-${index})`)}></div>
                {/each}
            </div>
        </div>
    </div>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <TypographyTitle heading={5}>AI Icon</TypographyTitle>
        <div style="display: flex; column-gap: 10px">
            <IconAIBellLevel1 size="extra-large" />
            <IconAIEditLevel2 size="extra-large" />
            <IconAIFileLevel3 size="extra-large" />
            <IconAIFilledLevel3 size="extra-large" />
            <IconAIImageLevel3 size="extra-large" />
            <IconAISearchLevel3 size="extra-large" />
            <IconAIStrokedLevel3 size="extra-large" />
            <IconAIWandLevel3 fill={wandFill} size="extra-large" />
            <IconAILoading size="extra-large" />
        </div>
    </div>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <TypographyTitle heading={5}>AI Button</TypographyTitle>
        <div style="display: flex; row-gap: 16px; flex-direction: column">
            <div style="display: flex; column-gap: 16px">
                <Button colorful icon={level1} theme="solid" type="primary">Colorful</Button>
                <Button colorful loading theme="solid" type="primary">Colorful</Button>
                <Button colorful disabled icon={level1} theme="solid" type="primary">Colorful</Button>
            </div>
            <div style="display: flex; column-gap: 16px">
                <Button colorful icon={level3} theme="solid" type="tertiary">Colorful</Button>
                <Button colorful loading theme="solid" type="tertiary">Colorful</Button>
                <Button colorful disabled icon={level3} theme="solid" type="tertiary">Colorful</Button>
            </div>
            <div style="display: flex; column-gap: 16px">
                <Button aria-label="AI" colorful icon={level1} theme="solid" type="primary" />
                <Button aria-label="AI" colorful loading theme="solid" type="primary" />
                <Button aria-label="AI" colorful disabled icon={level1} theme="solid" type="primary" />
                <Button aria-label="AI" colorful icon={level3} theme="solid" type="tertiary" />
                <Button aria-label="AI" colorful loading theme="solid" type="tertiary" />
                <Button aria-label="AI" colorful disabled icon={level3} theme="solid" type="tertiary" />
            </div>
        </div>
    </div>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <TypographyTitle heading={5} style="margin-top: 10px">AI Tag</TypographyTitle>
        <div style={grid}>
            <Tag colorful gradient prefixIcon={tagLevel1} shape="circle" type="solid">AI</Tag>
            <Tag colorful gradient prefixIcon={tagLevel3} shape="circle" type="light">AI</Tag>
            <Tag colorful gradient prefixIcon={tagLevel3} shape="circle" type="ghost">AI</Tag>
            <Tag colorful prefixIcon={tagLevel1} shape="circle" type="solid">AI</Tag>
            <Tag colorful prefixIcon={tagLevel1} shape="circle" type="light">AI</Tag>
            <Tag colorful prefixIcon={tagLevel1} shape="circle" type="ghost">AI</Tag>
        </div>
    </div>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <TypographyTitle heading={5} style="margin-top: 10px">AI FloatButton</TypographyTitle>
        <div style={grid}>
            <FloatButton aria-label="AI edit, VIP" badge={{ count: 'VIP', type: 'danger' }} colorful icon={editLevel1} size="large" style="position: static" />
        </div>
    </div>
</div>
