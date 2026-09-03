// MCP protocol constants — VOL-10 §1.2 (LOCKED): the MCP protocol version
// current at build time, pinned here and in /.well-known/jontrix-mcp.json.

export const MCP_PROTOCOL_VERSION = '2025-06-18';

/** Where tier-gated refusals send the user (single source across routes). */
export const UPGRADE_URL = '/?view=pricing';
