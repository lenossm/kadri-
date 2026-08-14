import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [clientAccess, setClientAccess] = useState([]);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfile(null);
      setMemberships([]);
      setClientAccess([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const uid = session.user.id;
      const [{ data: prof }, { data: mems }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('workspace_members').select('*, workspaces(*)').eq('user_id', uid).neq('status', 'removed'),
      ]);
      let access = [];
      const { data: cu } = await supabase.from('client_portal_users').select('id').eq('user_id', uid).maybeSingle();
      if (cu?.id) {
        const { data: rows } = await supabase.from('client_project_access').select('*, projects(id,title,workspace_id,workspaces(slug,name))').eq('client_user_id', cu.id).eq('status', 'active');
        access = rows || [];
      }
      if (cancelled) return;
      setProfile(prof || { id: uid, email: session.user.email, full_name: session.user.user_metadata?.full_name || '' });
      setMemberships((mems || []).filter((m) => m.status !== 'removed'));
      setClientAccess(access);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const value = useMemo(() => ({
    configured: supabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    memberships,
    clientAccess,
    loading,
    isClientOnly: Boolean(clientAccess.length) && !memberships.some((m) => m.status === 'active'),
    async signUp({ email, password, fullName }) {
      if (!supabase) throw new Error('Supabase is not configured');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      return data;
    },
    async signIn({ email, password }) {
      if (!supabase) throw new Error('Supabase is not configured');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
    },
    async resetPassword(email) {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
    },
    async updatePassword(password) {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    async refreshMemberships() {
      if (!supabase || !session?.user) return;
      const { data: mems } = await supabase.from('workspace_members').select('*, workspaces(*)').eq('user_id', session.user.id).neq('status', 'removed');
      setMemberships(mems || []);
    },
  }), [session, profile, memberships, clientAccess, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
