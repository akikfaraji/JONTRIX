export interface GlobalOpts {
    profile: string;
    endpoint?: string;
    nonInteractive: boolean;
    json: boolean;
}
export declare function run(argv: string[]): Promise<number>;
