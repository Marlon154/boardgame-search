import * as nunjucks from 'nunjucks';

export class PersistExtension {
    tags = ['persist'];

    parse(parser: any, nodes: any, lexer: any) {
        // Get the tag token
        const tok = parser.nextToken();

        // Parse arguments (the persist key/name)
        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        // Parse the body content until endpersist
        const body = parser.parseUntilBlocks('endpersist');
        parser.advanceAfterBlockEnd();

        // Return a CallExtension node
        return new nodes.CallExtension(this, 'run', args, [body]);
    }

    run(context: any, persistKey: string, body: () => string) {
        // Get persisted content from context if available
        const persistedSections = context.ctx.persistedSections || {};
        
        // If we have persisted content for this key, use it
        if (persistedSections[persistKey]) {
            // Return the persisted content wrapped in markers
            return `%% begin ${persistKey} %%\n${persistedSections[persistKey]}\n%% end ${persistKey} %%`;
        }
        
        const defaultContent = body();
        
        // Return wrapped in markers for future persistence
        return `%% begin ${persistKey} %%\n${defaultContent}\n%% end ${persistKey} %%`;
    }
}
