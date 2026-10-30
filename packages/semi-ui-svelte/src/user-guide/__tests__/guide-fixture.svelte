<script lang="ts">
    import type { UserGuideProps, UserGuideStepItem } from '../interface';
    import UserGuide from '../user-guide.svelte';

    type Mode = 'bind' | 'function' | 'one-way';

    let {
        mode = 'one-way',
        store,
    }: {
        mode?: Mode;
        store: {
            visible?: boolean;
            current?: number;
            accept: boolean;
            log: string[];
            steps: UserGuideStepItem[];
            // titles and the second description come from snippets
            rich: boolean;
            covers: 'none' | 'first' | 'all';
            // nextText and prevText snippets
            texts: boolean;
            props: Omit<UserGuideProps, 'visible' | 'current' | 'steps' | 'nextText' | 'prevText' | 'onChange' | 'onNext' | 'onPrev' | 'onSkip' | 'onFinish'>;
        };
    } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const steps = $derived(
        store.rich || store.covers !== 'none'
            ? store.steps.map((item, index) => ({
                  ...item,
                  title: store.rich ? titleSnippet : item.title,
                  description: store.rich && index === 1 ? descriptionSnippet : item.description,
                  cover: store.covers === 'all' || (store.covers === 'first' && index === 0) ? coverSnippet : undefined,
              }))
            : store.steps
    );

    const common = $derived({
        ...store.props,
        steps,
        nextText: store.texts ? nextText : undefined,
        prevText: store.texts ? prevText : undefined,
        onChange: (current: number) => log(`change ${current}`),
        onNext: (current: number) => log(`next ${current}`),
        onPrev: (current: number) => log(`prev ${current}`),
        onSkip: () => log('skip'),
        onFinish: () => log('finish'),
    });
</script>

{#snippet titleSnippet({ index }: { index: number })}
    <b class="custom-title">{store.steps[index]?.title}-{index}</b>
{/snippet}

{#snippet descriptionSnippet({ index }: { index: number })}
    <i class="custom-description">d{index}</i>
{/snippet}

{#snippet coverSnippet()}
    <img alt="cover-a" />
{/snippet}

{#snippet nextText()}
    <span>Forward</span>
{/snippet}

{#snippet prevText()}
    <span>Back</span>
{/snippet}

{#if mode === 'bind'}
    <UserGuide {...common} bind:visible={store.visible} current={store.current} />
{:else if mode === 'function'}
    <UserGuide
        {...common}
        bind:visible={
            () => store.visible,
            (value) => {
                log(`set visible ${value}`);
                if (store.accept) store.visible = value;
            }
        }
        current={store.current}
    />
{:else}
    <UserGuide {...common} current={store.current} visible={store.visible} />
{/if}
