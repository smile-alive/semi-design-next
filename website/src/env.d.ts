declare namespace App {
    interface Locals {
        docLinkTargets?: Promise<string[]>;
        // ApiType numbers instances per page to build aria-describedby ids
        apiTypeCount?: number;
    }
}
