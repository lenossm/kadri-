import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';

export default function ProfilePage() {
  const { profile, user, updatePassword } = useAuth();
  const { actor, isDemo } = useWorkspace();
  const { notify } = useToast();

  const save = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (isDemo || !supabase) {
      notify('Profile is saved on your account in a live workspace.');
      return;
    }
    const { error } = await supabase.from('profiles').update({
      full_name: form.fullName,
      job_title: form.jobTitle,
      phone: form.phone,
      timezone: form.timezone,
    }).eq('id', user.id);
    if (error) notify(error.message);
    else notify('Profile updated.');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (form.password !== form.confirm) {
      notify('Passwords do not match.');
      return;
    }
    try {
      await updatePassword(form.password);
      e.currentTarget.reset();
      notify('Password updated.');
    } catch (err) {
      notify(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="ACCOUNT" title="My profile" copy="You own this identity. Owners do not reset other people’s passwords from here." />
      <form className="modal-form profile-form" onSubmit={save}>
        <label>Full name<input name="fullName" defaultValue={profile?.full_name || actor?.name} /></label>
        <label>Email<input readOnly value={profile?.email || actor?.email || ''} /></label>
        <label>Job title<input name="jobTitle" defaultValue={profile?.job_title || actor?.title} /></label>
        <label>Phone<input name="phone" defaultValue={profile?.phone || ''} /></label>
        <label>Timezone<input name="timezone" defaultValue={profile?.timezone || 'Asia/Tbilisi'} /></label>
        <button className="primary-button" type="submit">Save profile</button>
      </form>
      {!isDemo && (
        <section className="settings-block">
          <span className="eyebrow">SECURITY</span>
          <h2>Password</h2>
          <form className="modal-form profile-form" onSubmit={changePassword}>
            <label>New password<input required type="password" name="password" minLength={8} /></label>
            <label>Confirm<input required type="password" name="confirm" /></label>
            <button className="secondary-button" type="submit">Update password</button>
          </form>
        </section>
      )}
    </div>
  );
}
