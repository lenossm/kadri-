import { useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { CAP, INTERNAL_ROLES, ROLE_LABELS } from '../permissions/engine';
import { supabase } from '../lib/supabase';

const demoRoles = [
  { id: 'owner', copy: 'Full studio — team, finance, every project.' },
  { id: 'admin', copy: 'Operational control without destroying the company.' },
  { id: 'producer', copy: 'Inquiries through delivery. Finance stays configurable.' },
  { id: 'production_manager', copy: 'Stages, schedule, logistics. No ledger, no team admin.' },
  { id: 'editor', copy: 'Only assigned projects. No payments, no Team.' },
  { id: 'finance', copy: 'Invoices and outstanding balances. No review room.' },
  { id: 'viewer', copy: 'Read-only on permitted productions.' },
];

export default function SettingsPage() {
  const { role, setRole, resetDemo, isDemo, workspace, can, actor, reload } = useWorkspace();
  const { notify } = useToast();
  const [confirm, setConfirm] = useState(false);
  const manage = can(CAP.SETTINGS);

  const reset = () => {
    resetDemo();
    setConfirm(false);
    notify('Demo workspace restored to the original cut.');
  };

  const saveLive = async (e) => {
    e.preventDefault();
    if (!supabase || !workspace?.id) return;
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const { error } = await supabase.from('workspaces').update({
      name: form.name,
      country: form.country,
      timezone: form.timezone,
      currency: form.currency,
    }).eq('id', workspace.id);
    if (error) notify(error.message);
    else {
      notify('Workspace updated.');
      reload?.();
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={isDemo ? 'DEMO / SETTINGS' : 'COMPANY / SETTINGS'}
        title="Workspace"
        copy={isDemo
          ? 'Isolated sales demo. Switching role here never impersonates a live account. Real productions use Team invitations.'
          : 'Production name, timezone and currency. Team and invitations live under Team.'}
      />

      {isDemo && (
        <section className="settings-block">
          <span className="eyebrow">LOOK THROUGH</span>
          <h2>Demo identity</h2>
          <p>Each card is a different employee of HOORAY! Production. This switcher exists only in demo mode.</p>
          <div className="role-grid role-grid--seven">
            {demoRoles.map((r) => (
              <button type="button" key={r.id} className={`role-card ${role === r.id ? 'is-active' : ''}`} onClick={() => { setRole(r.id); notify(`Viewing as ${ROLE_LABELS[r.id]}.`); }}>
                <strong>{ROLE_LABELS[r.id]}</strong>
                <p>{r.copy}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {!isDemo && manage && (
        <section className="settings-block">
          <span className="eyebrow">GENERAL</span>
          <h2>Production</h2>
          <form className="modal-form profile-form" onSubmit={saveLive}>
            <label>Production company name<input name="name" defaultValue={workspace?.name} required /></label>
            <label>Country<input name="country" defaultValue={workspace?.country || 'GE'} /></label>
            <label>Timezone<input name="timezone" defaultValue={workspace?.timezone || 'Asia/Tbilisi'} /></label>
            <label>Default currency<select name="currency" defaultValue={workspace?.currency || 'GEL'}><option>GEL</option><option>EUR</option><option>USD</option></select></label>
            <button className="primary-button" type="submit">Save settings</button>
          </form>
        </section>
      )}

      {!isDemo && !manage && (
        <section className="settings-block">
          <p>Workspace settings are limited to Owner and Admin. Signed in as {actor?.name}.</p>
        </section>
      )}

      {isDemo && (
        <section className="settings-block">
          <span className="eyebrow">BOARD</span>
          <h2>Reset demo data</h2>
          <p>Restores the original inquiries, projects, reviews, invoices and publishing slate. Only KADRI demo keys are cleared.</p>
          <button type="button" className="secondary-button" onClick={() => setConfirm(true)}>Reset demo data</button>
        </section>
      )}

      {can(CAP.AUDIT) && !isDemo && (
        <section className="settings-block">
          <span className="eyebrow">SECURITY</span>
          <h2>Audit</h2>
          <p>Invites, role changes and client access live in the audit log. Members cannot edit history.</p>
        </section>
      )}

      <p className="muted-line">Internal roles: {INTERNAL_ROLES.map((r) => ROLE_LABELS[r]).join(' · ')}. Clients are never workspace members.</p>

      <Modal open={confirm} title="Reset the demo?" onClose={() => setConfirm(false)}>
        <div className="modal-form">
          <p>Reset the demo workspace to its original state? Unsaved walkthrough edits will be lost.</p>
          <div className="detail-actions">
            <button type="button" className="secondary-button" onClick={() => setConfirm(false)}>Cancel</button>
            <button type="button" className="primary-button" onClick={reset}>Reset workspace</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
