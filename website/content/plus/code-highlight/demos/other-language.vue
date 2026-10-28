<script setup lang="ts">
    import { CodeHighlight } from '@fibrae/semi-ui-vue';

    // declared at the top level so the array is not new on every render, which would highlight again
    const languages = [() => import('shiki/langs/vala.mjs')];

    const code = `public class ExampleApp : Gtk.Application {
    public ExampleApp () {
        Object (application_id: "com.example.App");
    }

    public override void activate () {
        var win = new Gtk.ApplicationWindow (this);

        var btn = new Gtk.Button.with_label ("Hello World");
        btn.clicked.connect (win.close);

        win.child = btn;
        win.present ();
    }

    public static int main (string[] args) {
        var app = new ExampleApp ();
        return app.run (args);
    }
}
`;
</script>

<template>
    <CodeHighlight :code="code" language="vala" :languages="languages" />
</template>
