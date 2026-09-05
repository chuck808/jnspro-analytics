// Parallel Home redesign deliberately reuses the existing dashboard data contract.
// Keeping one loader prevents the mock-up route from inventing a second set of
// metric semantics while the new presentation is evaluated.
export { load } from '../dashboard/+page.server';
