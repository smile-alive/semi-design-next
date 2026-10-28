import { CodeHighlight } from '@fibrae/semi-ui-solid';

const languages = [() => import('shiki/langs/vala.mjs')];

export default function CodeHighlightDemo() {
    return (
        <CodeHighlight
            languages={languages}
            language="vala"
            code={`public class ExampleApp : Gtk.Application {
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
`}
        />
    );
}
