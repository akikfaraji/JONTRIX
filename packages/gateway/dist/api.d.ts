export interface CallMeta {
    status: number;
    body: unknown;
    headers: Headers;
}
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly retryAfter?: number | undefined;
    constructor(status: number, code: string, message: string, retryAfter?: number | undefined);
}
/** POST/GET with the §5.6 network policy. Bearer optional. */
export declare function request(base: string, path: string, opts?: {
    method?: 'GET' | 'POST';
    bearer?: string;
    json?: unknown;
    okStatuses?: number[];
}): Promise<CallMeta>;
export declare const QUOTA_TTL_MS = 60000;
export declare const CATALOG_TTL_MS = 3600000;
export declare function fetchQuota(base: string, bearer: string): Promise<Record<string, unknown>>;
export declare function fetchCatalog(base: string, bearer: string, opts?: {
    offline?: boolean;
}): Promise<{
    protocol_version: string;
    tools: Array<Record<string, unknown>>;
    stale: boolean;
}>;
export declare function codeOf(body: unknown): string;
export declare function messageOf(body: unknown): string;
