<script lang="ts">
    import { code as Code, h1 as H1, h2 as H2, p as P } from '../components';
</script>

<div>
    <H1 class="x">title</H1>
    <H2 class="z">second</H2>
    <P class="y">body</P>
    <Code class="x language-js" node={{ type: 'code', props: { children: 'let a = 1;' } }}>let a = 1;</Code>
    <Code>inline</Code>
</div>
