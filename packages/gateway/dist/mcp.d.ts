export interface McpServerDeps {
    endpoint: string;
    bearer: () => string | undefined;
    onDeadToken?: () => void;
}
export declare function serveStdio(deps: McpServerDeps): void;
