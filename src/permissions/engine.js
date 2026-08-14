export const CAP = {
  DASHBOARD: 'dashboard.view',
  INQUIRY_VIEW: 'inquiry.view',
  INQUIRY_MANAGE: 'inquiry.manage',
  PROJECT_VIEW: 'project.view',
  PROJECT_CREATE: 'project.create',
  PROJECT_EDIT: 'project.edit',
  PROJECT_ASSIGN: 'project.assign_members',
  PROJECT_STAGE: 'project.change_stage',
  PROJECT_FINANCIALS: 'project.view_financials',
  REVIEW_VIEW: 'review.view',
  REVIEW_UPLOAD: 'review.upload',
  REVIEW_PUBLISH: 'review.publish',
  REVIEW_COMMENT_INTERNAL: 'review.comment_internal',
  REVIEW_APPROVE: 'review.approve',
  CLIENT_VIEW: 'client.view',
  CLIENT_MANAGE: 'client.manage',
  CLIENT_INVITE: 'client.invite',
  IDEA_VIEW: 'idea.view',
  IDEA_MANAGE: 'idea.manage',
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_MANAGE: 'delivery.manage',
  TEAM_VIEW: 'team.view',
  TEAM_MANAGE: 'team.manage',
  SETTINGS: 'workspace.settings.manage',
  AUDIT: 'audit.view',
  NOTE_INTERNAL: 'note.internal.view',
  FINANCE_VIEW: 'finance.view',
  FINANCE_EDIT: 'finance.edit',
  FINANCE_COST: 'finance.view_internal_cost',
  FINANCE_MARGIN: 'finance.view_margin',
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_MANAGE: 'payment.manage',
  WORKSPACE_DELETE: 'workspace.delete',
  OWNERSHIP: 'workspace.transfer_ownership',
};

export const INTERNAL_ROLES = ['owner', 'admin', 'producer', 'production_manager', 'editor', 'finance', 'viewer'];

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  producer: 'Producer',
  production_manager: 'Production Manager',
  editor: 'Editor',
  finance: 'Finance',
  viewer: 'Viewer',
};

const ALL_EXCEPT_DESTRUCTIVE = Object.values(CAP).filter((c) => c !== CAP.WORKSPACE_DELETE && c !== CAP.OWNERSHIP);

export const ROLE_CAPS = {
  owner: ['*'],
  admin: ALL_EXCEPT_DESTRUCTIVE,
  producer: [
    CAP.DASHBOARD, CAP.INQUIRY_VIEW, CAP.INQUIRY_MANAGE,
    CAP.PROJECT_VIEW, CAP.PROJECT_CREATE, CAP.PROJECT_EDIT, CAP.PROJECT_ASSIGN, CAP.PROJECT_STAGE,
    CAP.REVIEW_VIEW, CAP.REVIEW_UPLOAD, CAP.REVIEW_PUBLISH, CAP.REVIEW_COMMENT_INTERNAL, CAP.REVIEW_APPROVE,
    CAP.CLIENT_VIEW, CAP.CLIENT_MANAGE, CAP.CLIENT_INVITE,
    CAP.IDEA_VIEW, CAP.IDEA_MANAGE, CAP.DELIVERY_VIEW, CAP.DELIVERY_MANAGE,
    CAP.TEAM_VIEW, CAP.NOTE_INTERNAL,
  ],
  production_manager: [
    CAP.DASHBOARD, CAP.PROJECT_VIEW, CAP.PROJECT_EDIT, CAP.PROJECT_STAGE,
    CAP.REVIEW_VIEW, CAP.REVIEW_COMMENT_INTERNAL,
    CAP.IDEA_VIEW, CAP.DELIVERY_VIEW, CAP.NOTE_INTERNAL,
  ],
  editor: [
    CAP.DASHBOARD, CAP.PROJECT_VIEW,
    CAP.REVIEW_VIEW, CAP.REVIEW_UPLOAD, CAP.REVIEW_COMMENT_INTERNAL,
    CAP.IDEA_VIEW, CAP.DELIVERY_VIEW, CAP.NOTE_INTERNAL,
  ],
  finance: [
    CAP.DASHBOARD, CAP.CLIENT_VIEW,
    CAP.FINANCE_VIEW, CAP.FINANCE_EDIT, CAP.FINANCE_COST, CAP.FINANCE_MARGIN,
    CAP.PAYMENT_VIEW, CAP.PAYMENT_MANAGE, CAP.PROJECT_FINANCIALS, CAP.PROJECT_VIEW,
  ],
  viewer: [CAP.DASHBOARD, CAP.PROJECT_VIEW, CAP.REVIEW_VIEW],
};

export const DEFAULT_PROJECT_ACCESS = {
  owner: 'all',
  admin: 'all',
  producer: 'all',
  production_manager: 'all',
  editor: 'selected',
  finance: 'all',
  viewer: 'selected',
};

const WRITE_CAPS = new Set(Object.values(CAP).filter((c) => /manage|create|edit|assign|change_stage|upload|publish|approve|invite|delete|transfer/.test(c)));

export function roleHas(role, cap) {
  const list = ROLE_CAPS[role] || [];
  return list.includes('*') || list.includes(cap);
}

export function can(ctx, cap, opts = {}) {
  if (!ctx || ctx.status && ctx.status !== 'active') return false;
  if (ctx.kind === 'client') {
    const perms = ctx.clientPerms || {};
    return Boolean(perms[cap]);
  }
  if (ctx.role === 'viewer' && WRITE_CAPS.has(cap)) return false;
  const extras = ctx.extraPermissions || ctx.extra || [];
  const allowed = roleHas(ctx.role, cap) || extras.includes(cap);
  if (!allowed) return false;
  if (opts.projectId && ctx.projectAccess === 'selected') {
    const assigned = ctx.assignedProjectIds || [];
    if (!assigned.includes(opts.projectId)) return false;
  }
  return true;
}

export function filterProjects(projects, ctx) {
  if (!ctx) return [];
  if (ctx.projectAccess === 'all' || ctx.role === 'owner' || ctx.role === 'admin') return projects;
  const assigned = new Set(ctx.assignedProjectIds || []);
  return projects.filter((p) => assigned.has(p.id));
}

export function navItemsFor(ctx) {
  const items = [];
  if (can(ctx, CAP.DASHBOARD)) items.push(['dashboard', 'Dashboard']);
  if (can(ctx, CAP.PROJECT_VIEW) || can(ctx, CAP.PROJECT_STAGE)) items.push(['pipeline', 'Pipeline']);
  if (can(ctx, CAP.PROJECT_VIEW)) items.push(['projects', 'Projects']);
  if (can(ctx, CAP.REVIEW_VIEW)) items.push(['reviews', 'Reviews']);
  if (can(ctx, CAP.INQUIRY_VIEW)) items.push(['inquiries', 'Inquiries']);
  if (can(ctx, CAP.IDEA_VIEW)) items.push(['ideas', 'Idea Pool']);
  if (can(ctx, CAP.CLIENT_VIEW)) items.push(['clients', 'Clients']);
  if (can(ctx, CAP.PAYMENT_VIEW) || can(ctx, CAP.FINANCE_VIEW)) items.push(['payments', 'Payments']);
  if (can(ctx, CAP.DELIVERY_VIEW)) items.push(['publishing', 'Publishing']);
  if (can(ctx, CAP.TEAM_VIEW) || can(ctx, CAP.TEAM_MANAGE)) items.push(['team', 'Team']);
  if (can(ctx, CAP.SETTINGS) || can(ctx, CAP.AUDIT)) items.push(['settings', 'Settings']);
  return items;
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'K';
}
