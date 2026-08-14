import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { CAP, INTERNAL_ROLES, ROLE_LABELS, can } from '../permissions/engine';
import { supabase } from '../lib/supabase';

const FILTERS = [
  ['all', 'All'],
  ['lead', 'Owner/Admin'],
  ['production', 'Production'],
  ['post', 'Post-production'],
  ['finance', 'Finance'],
  ['viewers', 'Viewers'],
  ['pending', 'Pending invitations'],
];

export default function TeamPage() {
  const { team = [], projects, projectMembers = [], perm, workspace, isDemo, href, actor, reload } = useWorkspace();
  const { notify } = useToast();
  const [filter, setFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const manage = can(perm, CAP.TEAM_MANAGE);

  const visible = useMemo(() => team.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'lead') return m.role === 'owner' || m.role === 'admin';
    if (filter === 'production') return m.role === 'producer' || m.role === 'production_manager';
    if (filter === 'post') return m.role === 'editor';
    if (filter === 'finance') return m.role === 'finance';
    if (filter === 'viewers') return m.role === 'viewer';
    return true;
  }), [team, filter]);

  const assigned = (userId) => projectMembers.filter((m) => m.userId === userId).map((m) => projects.find((p) => p.id === m.projectId)?.title).filter(Boolean);

  const sendInvite = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (isDemo) {
      notify('Demo: copy this pattern in a live workspace. Invitations write to Supabase.');
      setInviteOpen(false);
      return;
    }
    const { data, error } = await supabase.from('workspace_invitations').insert({
      workspace_id: workspace.id,
      email: form.email,
      role: form.role,
      project_access: form.access,
      invited_by: actor.id,
    }).select('token').single();
    if (error) {
      notify(error.message);
      return;
    }
    const link = `${window.location.origin}/invite/${data.token}`;
    setInviteLink(link);
    notify('Invitation created. Send the link — email sending uses your Supabase SMTP.');
    reload?.();
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="COMPANY / TEAM"
        title="Team"
        copy="Every person has their own account. Roles live on the workspace, not on the login."
        actions={manage ? <button className="primary-button" type="button" onClick={() => { setInviteLink(''); setInviteOpen(true); }}>Invite member</button> : null}
      />
      <div className="toolbar">
        {FILTERS.filter((f) => f[0] !== 'pending').map(([id, label]) => (
          <button type="button" key={id} className={`quiet-button ${filter === id ? 'is-on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      {visible.length ? (
        <div className="data-table">
          <div className="data-table__head"><span>PERSON</span><span>ROLE</span><span>ACCESS</span><span>PROJECTS</span><span>STATUS</span></div>
          {visible.map((m) => (
            <button type="button" className="data-table__row data-table__row--link" key={m.id} onClick={() => manage && setEdit(m)}>
              <span><b>{m.name}</b><small className="muted-line">{m.email}</small></span>
              <span>{ROLE_LABELS[m.role] || m.role}</span>
              <span>{m.projectAccess === 'all' ? 'All projects' : 'Selected'}</span>
              <span>{assigned(m.id).join(', ') || '—'}</span>
              <StatusPill>{m.status}</StatusPill>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No people in this filter." copy="Invite a producer, editor or finance lead." />
      )}

      <Modal open={inviteOpen} title="Invite member" onClose={() => setInviteOpen(false)}>
        {inviteLink ? (
          <div className="modal-form">
            <p>Share this link. They create their own account, then join with the assigned role.</p>
            <label>Invite link<input readOnly value={inviteLink} /></label>
            <button className="primary-button" type="button" onClick={() => { navigator.clipboard.writeText(inviteLink); notify('Link copied.'); }}>Copy link</button>
          </div>
        ) : (
          <form className="modal-form" onSubmit={sendInvite}>
            <label>Email<input required type="email" name="email" /></label>
            <label>Role
              <select name="role" defaultValue="editor">
                {INTERNAL_ROLES.filter((r) => r !== 'owner').map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </label>
            <label>Project access
              <select name="access" defaultValue="selected">
                <option value="all">All projects</option>
                <option value="selected">Selected projects only</option>
              </select>
            </label>
            <button className="primary-button" type="submit">Create invitation</button>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(edit)} title={edit?.name || 'Member'} onClose={() => setEdit(null)} wide>
        {edit && <MemberEditor member={edit} projects={projects} projectMembers={projectMembers} workspace={workspace} isDemo={isDemo} actor={actor} onClose={() => setEdit(null)} notify={notify} reload={reload} />}
      </Modal>
    </div>
  );
}

function MemberEditor({ member, projects, projectMembers, workspace, isDemo, actor, onClose, notify, reload }) {
  const selected = new Set(projectMembers.filter((m) => m.userId === member.id).map((m) => m.projectId));
  const save = async (e) => {
    e.preventDefault();
    if (isDemo) {
      notify('Live workspaces save role and project access in Supabase. Demo identities stay local.');
      onClose();
      return;
    }
    const form = new FormData(e.currentTarget);
    const role = form.get('role');
    const access = form.get('access');
    const extras = ['finance', 'upload', 'publish', 'clients'].filter((k) => form.get(k));
    const extra_permissions = [];
    if (extras.includes('finance')) extra_permissions.push('finance.view', 'project.view_financials');
    if (extras.includes('upload')) extra_permissions.push('review.upload');
    if (extras.includes('publish')) extra_permissions.push('review.publish');
    if (extras.includes('clients')) extra_permissions.push('client.view');
    await supabase.from('workspace_members').update({ role, project_access: access, extra_permissions }).eq('id', member.memberId);
    const chosen = form.getAll('project');
    await supabase.from('project_members').delete().eq('user_id', member.id).eq('workspace_id', workspace.id);
    if (chosen.length) {
      await supabase.from('project_members').insert(chosen.map((project_id) => ({
        workspace_id: workspace.id, project_id, user_id: member.id, project_role: ROLE_LABELS[role] || 'Member', assigned_by: actor.id,
      })));
    }
    await supabase.from('audit_logs').insert({ workspace_id: workspace.id, actor_id: actor.id, actor_name: actor.name, action: 'member.permissions_changed', meta: { user: member.email, role } });
    notify('Permissions saved.');
    reload?.();
    onClose();
  };

  const suspend = async (status) => {
    if (isDemo || member.role === 'owner') return;
    await supabase.from('workspace_members').update({ status }).eq('id', member.memberId);
    notify(status === 'suspended' ? 'Member suspended.' : 'Member reactivated.');
    reload?.();
    onClose();
  };

  return (
    <form className="modal-form" onSubmit={save}>
      <p>{member.email} · {member.title}</p>
      <label>Role
        <select name="role" defaultValue={member.role} disabled={member.role === 'owner'}>
          {INTERNAL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </label>
      <label>Project access
        <select name="access" defaultValue={member.projectAccess}>
          <option value="all">All projects</option>
          <option value="selected">Selected projects</option>
        </select>
      </label>
      <fieldset className="perm-fieldset">
        <legend>Selected projects</legend>
        {projects.map((p) => (
          <label className="check" key={p.id}>
            <input type="checkbox" name="project" value={p.id} defaultChecked={selected.has(p.id)} /> {p.title}
          </label>
        ))}
      </fieldset>
      <fieldset className="perm-fieldset">
        <legend>Additional permissions</legend>
        <label className="check"><input type="checkbox" name="finance" /> View project financials</label>
        <label className="check"><input type="checkbox" name="upload" /> Upload review versions</label>
        <label className="check"><input type="checkbox" name="publish" /> Publish review to client</label>
        <label className="check"><input type="checkbox" name="clients" /> View client information</label>
      </fieldset>
      <div className="detail-actions">
        <button className="primary-button" type="submit">Save permissions</button>
        {member.role !== 'owner' && <button className="secondary-button" type="button" onClick={() => suspend(member.status === 'suspended' ? 'active' : 'suspended')}>{member.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>}
      </div>
    </form>
  );
}
