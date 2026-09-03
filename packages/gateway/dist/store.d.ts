export interface Profile {
    endpoint: string;
    agent_name?: string;
}
export declare const CONFIG_DIR: string;
export declare function readProfiles(): Record<string, Profile>;
export declare function writeProfile(name: string, profile: Profile): void;
export interface SecretEntry {
    access_token?: string;
    refresh_token?: string;
    aat?: string;
    pat?: string;
    endpoint: string;
    kind: 'session' | 'aat' | 'pat';
    last4: string;
    scope?: string;
}
export declare function keyringAvailable(): boolean;
export declare function readSecrets(): Record<string, SecretEntry>;
export declare function writeSecret(profile: string, entry: SecretEntry): void;
export declare function deleteSecret(profile: string): void;
export declare function last4(secret: string): string;
