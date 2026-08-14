import { useState } from 'react';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';

const roles = [
  { id: 'producer', label: 'Producer', copy: 'Full internal workspace — inquiries through payments.' },
  { id: 'editor', label: 'Editor', copy: 'Projects, pipeline, reviews and publishing. No ledger.' },
  { id: 'client', label: 'Client', copy: 'Northline’s view: their projects, reviews and portal.' },
];

export default function SettingsPage() {
  const { role, setRole, resetDemo } = useWorkspace();
  const { notify } = useToast();
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    resetDemo();
    setConfirm(false);
    notify('Demo workspace restored to the original cut.');
  };

  return (
    <div className="page">
      <PageHeader eyebrow="DEMO / SETTINGS" title="Workspace" copy="This is an interactive sales demo. Nothing here is a live client account. Switch role for the walkthrough, or reset the board between meetings." />

      <section className="settings-block">
        <span className="eyebrow">LOOK THROUGH</span>
        <h2>Demo role</h2>
        <div className="role-grid">
          {roles.map((r) => (
            <button type="button" key={r.id} className={`role-card ${role === r.id ? 'is-active' : ''}`} onClick={() => { setRole(r.id); notify(`Viewing as ${r.label}.`); }}>
              <strong>{r.label}</strong>
              <p>{r.copy}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <span className="eyebrow">BOARD</span>
        <h2>Reset demo data</h2>
        <p>Restores the original inquiries, projects, reviews, invoices and publishing slate. Only KADRI demo keys are cleared.</p>
        <button type="button" className="secondary-button" onClick={() => setConfirm(true)}>Reset demo data</button>
      </section>

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
