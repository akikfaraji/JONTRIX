import { last4 } from './store.js';
export interface GlobalOpts {
    profile: string;
    endpoint?: string;
    nonInteractive: boolean;
}
export declare function describe(body: unknown): string;
export declare function login(opts: GlobalOpts, flags: Record<string, string | boolean>): Promise<number>;
export declare function logout(opts: GlobalOpts): Promise<number>;
export declare function whoami(opts: GlobalOpts, json: boolean): Promise<number>;
export { last4 };
