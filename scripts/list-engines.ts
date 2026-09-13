import { BUILT_JONT_IDS } from '../src/lib/jont-runtime/engines/index.ts';
import { CLIENT_BUILT_JONT_IDS } from '../src/lib/jont-runtime/client-engines/index.ts';

console.log(`SERVER ENGINES (${BUILT_JONT_IDS.length}):`);
console.log(BUILT_JONT_IDS.join('\n'));
console.log(`\nCLIENT ENGINES (${CLIENT_BUILT_JONT_IDS.length}):`);
console.log(CLIENT_BUILT_JONT_IDS.join('\n'));
