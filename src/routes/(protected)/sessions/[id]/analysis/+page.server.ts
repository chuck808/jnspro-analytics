/**
 * Re-export parent actions to make them available on the /analysis route
 * 
 * This allows forms on the analysis page (like RunTagSelector) to submit
 * to actions defined in the parent +page.server.ts file.
 */

export { actions } from '../+page.server';
