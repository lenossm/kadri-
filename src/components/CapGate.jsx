import { useWorkspace } from '../state/WorkspaceContext';
import ForbiddenPage from '../pages/ForbiddenPage';

export default function CapGate({ cap, children }) {
  const { can } = useWorkspace();
  if (cap && !can(cap)) return <ForbiddenPage title="You don't have access to this area." copy="This module is limited by your workspace role and project assignments." />;
  return children;
}
