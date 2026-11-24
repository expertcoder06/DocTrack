/**
 * StatusBadge.tsx – Colored pill badge for application statuses.
 */

import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '../types';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}
