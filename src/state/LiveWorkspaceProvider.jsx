import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MEDIA, stages } from '../data/fixtures';
import { supabase } from '../lib/supabase';
import { CAP, can as canCap } from '../permissions/engine';
import { paymentStatus } from '../utils/selectors';
import { useAuth } from './AuthContext';
import { WorkspaceContext } from './WorkspaceContext';

function mapProject(row, financials) {
  const fin = financials.find((f) => f.project_id === row.id);
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    location: row.location,
    stage: row.stage,
    status: row.status,
    due: row.due,
    start: row.start_date,
    shootDate: row.shoot_date,
    owner: row.owner_name,
    progress: row.progress,
    budget: fin?.budget ?? 0,
    clientId: row.client_id,
    inquiryId: row.inquiry_id,
    brief: row.brief,
    objective: row.objective,
    deliverables: row.deliverables || [],
    direction: row.direction,
    format: row.format,
    crew: row.crew,
    notes: row.notes,
  };
}

export function LiveWorkspaceProvider({ children }) {
  const { workspaceSlug } = useParams();
  const { user, profile, memberships, signOut } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [member, setMember] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !workspaceSlug || !user) return;
    setLoading(true);
    const { data: ws, error: wsErr } = await supabase.from('workspaces').select('*').eq('slug', workspaceSlug).maybeSingle();
    if (wsErr || !ws) {
      setError(wsErr?.message || 'Workspace not found.');
      setLoading(false);
      return;
    }
    const mem = (memberships || []).find((m) => m.workspace_id === ws.id);
    if (!mem || mem.status === 'suspended') {
      setError(mem?.status === 'suspended' ? 'Your workspace membership has been suspended.' : 'You don\'t have access to this workspace.');
      setWorkspace(ws);
      setMember(mem || null);
      setLoading(false);
      return;
    }
    const wid = ws.id;
    const [
      projectsRes, clientsRes, inquiriesRes, ideasRes, reviewsRes, commentsRes,
      invoicesRes, deliveryRes, activityRes, membersRes, teamRes, notesRes, financialsRes,
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('workspace_id', wid),
      supabase.from('clients').select('*').eq('workspace_id', wid),
      supabase.from('inquiries').select('*').eq('workspace_id', wid),
      supabase.from('ideas').select('*').eq('workspace_id', wid),
      supabase.from('review_versions').select('*').eq('workspace_id', wid),
      supabase.from('review_comments').select('*').eq('workspace_id', wid),
      supabase.from('invoices').select('*').eq('workspace_id', wid),
      supabase.from('delivery_items').select('*').eq('workspace_id', wid),
      supabase.from('activity_events').select('*').eq('workspace_id', wid).order('at', { ascending: false }).limit(40),
      supabase.from('project_members').select('*').eq('workspace_id', wid),
      supabase.from('workspace_members').select('*, profiles(*)').eq('workspace_id', wid).neq('status', 'removed'),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('project_financials').select('*').eq('workspace_id', wid),
    ]);
    const comments = commentsRes.data || [];
    setWorkspace(ws);
    setMember(mem);
    setData({
      projects: (projectsRes.data || []).map((p) => mapProject(p, financialsRes.data || [])),
      clients: (clientsRes.data || []).map((c) => ({ id: c.id, name: c.name, contact: c.contact, email: c.email, phone: c.phone, last: c.last_active })),
      inquiries: (inquiriesRes.data || []).map((x) => ({ ...x, projectName: x.project_name, createdAt: x.created_at })),
      ideas: ideasRes.data || [],
      reviews: (reviewsRes.data || []).map((r) => ({
        id: r.id,
        projectId: r.project_id,
        title: r.title,
        version: r.version,
        status: r.status,
        due: r.due,
        submittedAt: r.submitted_at,
        publishedToClient: r.published_to_client,
        comments: comments.filter((c) => c.review_id === r.id).map((c) => ({
          id: c.id, time: Number(c.time_seconds), author: c.author_name, text: c.text, visibility: c.visibility,
        })),
      })),
      payments: (invoicesRes.data || []).map((p) => ({
        id: p.id, projectId: p.project_id, clientId: p.client_id, invoice: p.invoice,
        amount: Number(p.amount), issued: p.issued, due: p.due, status: p.status,
      })),
      publishing: (deliveryRes.data || []).map((p) => ({
        id: p.id, projectId: p.project_id, publicTitle: p.public_title, category: p.category,
        destination: p.destination, planned: p.planned, status: p.status, featured: p.featured,
      })),
      activity: (activityRes.data || []).map((a) => ({ id: a.id, at: a.at, text: a.text, projectId: a.project_id, visibility: a.visibility })),
      projectMembers: (membersRes.data || []).map((m) => ({ projectId: m.project_id, userId: m.user_id, projectRole: m.project_role })),
      team: (teamRes.data || []).map((m) => ({
        id: m.user_id,
        name: m.profiles?.full_name || m.job_title || 'Member',
        email: m.profiles?.email,
        title: m.job_title || m.role,
        role: m.role,
        status: m.status,
        projectAccess: m.project_access,
        extraPermissions: m.extra_permissions || [],
        memberId: m.id,
      })),
      notifications: notesRes.data || [],
    });
    setError(null);
    setLoading(false);
  }, [workspaceSlug, user, memberships]);

  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(true);
  }, [workspaceSlug]);

  useEffect(() => { load(); }, [load]);

  const assignedProjectIds = useMemo(() => {
    if (!data || !user) return [];
    return data.projectMembers.filter((m) => m.userId === user.id).map((m) => m.projectId);
  }, [data, user]);

  const perm = useMemo(() => ({
    kind: 'member',
    role: member?.role || 'viewer',
    status: member?.status || 'active',
    projectAccess: member?.project_access || 'selected',
    assignedProjectIds,
    extraPermissions: member?.extra_permissions || [],
  }), [member, assignedProjectIds]);

  const actor = useMemo(() => ({
    id: user?.id,
    name: profile?.full_name || user?.email,
    title: member?.job_title || member?.role,
    email: profile?.email || user?.email,
  }), [user, profile, member]);

  const dispatch = useCallback(async (action) => {
    if (!supabase || !workspace || perm.role === 'viewer') return;
    const wid = workspace.id;
    const actorName = actor.name;
    if (action.type === 'ADD_INQUIRY') {
      await supabase.from('inquiries').insert({
        workspace_id: wid, company: action.payload.company, person: action.payload.person, email: action.payload.email,
        phone: action.payload.phone, project_name: action.payload.projectName, type: action.payload.type,
        budget: action.payload.budget, timeline: action.payload.timeline, message: action.payload.message,
        source: action.payload.source || 'Manual', created_by: user.id,
      });
    }
    if (action.type === 'UPDATE_INQUIRY') await supabase.from('inquiries').update(action.patch).eq('id', action.id);
    if (action.type === 'SET_INQUIRY_STATUS') await supabase.from('inquiries').update({ status: action.status }).eq('id', action.id);
    if (action.type === 'UPDATE_PROJECT') await supabase.from('projects').update(action.patch).eq('id', action.id);
    if (action.type === 'MOVE_PROJECT') {
      const i = stages.indexOf(action.stage);
      const progress = Math.round(((Math.max(i, 0) + 1) / stages.length) * 100);
      await supabase.from('projects').update({ stage: action.stage, progress }).eq('id', action.id);
    }
    if (action.type === 'ADD_REVIEW_COMMENT') {
      await supabase.from('review_comments').insert({
        workspace_id: wid, review_id: action.id, author_id: user.id, author_name: actorName,
        time_seconds: action.payload.time, text: action.payload.text, visibility: action.payload.visibility || 'internal',
      });
    }
    if (action.type === 'SET_REVIEW_STATUS') await supabase.from('review_versions').update({ status: action.status }).eq('id', action.id);
    if (action.type === 'PUBLISH_REVIEW') await supabase.from('review_versions').update({ published_to_client: true }).eq('id', action.id);
    if (action.type === 'SET_PAYMENT_STATUS') await supabase.from('invoices').update({ status: action.status }).eq('id', action.id);
    if (action.type === 'SET_PUBLISHING') await supabase.from('delivery_items').update(action.patch).eq('id', action.id);
    if (action.type === 'ADD_PUBLISHING') {
      await supabase.from('delivery_items').insert({
        workspace_id: wid, project_id: action.payload.projectId, public_title: action.payload.publicTitle,
        category: action.payload.category, destination: action.payload.destination, planned: action.payload.planned,
        status: action.payload.status || 'Scheduled', featured: action.payload.featured, created_by: user.id,
      });
    }
    if (action.type === 'CONVERT_INQUIRY') {
      const inquiry = data.inquiries.find((x) => x.id === action.id);
      if (inquiry) {
        await supabase.from('projects').insert({
          id: action.projectId, workspace_id: wid, title: inquiry.projectName || inquiry.company, type: inquiry.type,
          stage: 'Brief', status: 'Planning', due: action.due || null, owner_name: action.owner || actorName,
          brief: inquiry.message, created_by: user.id,
        });
        await supabase.from('inquiries').update({ status: 'Converted' }).eq('id', action.id);
      }
    }
    await supabase.from('activity_events').insert({ workspace_id: wid, actor_id: user.id, actor_name: actorName, text: `${actorName} · ${action.type.replace(/_/g, ' ').toLowerCase()}` });
    await load();
  }, [workspace, perm.role, actor, user, data, load]);

  const convertInquiry = useCallback(async (id, extras = {}) => {
    const projectId = extras.projectId || crypto.randomUUID();
    await dispatch({ type: 'CONVERT_INQUIRY', id, projectId, owner: extras.owner, due: extras.due });
    return projectId;
  }, [dispatch]);

  const can = useCallback((cap, opts) => canCap(perm, cap, opts), [perm]);
  const basePath = workspace ? `/app/${workspace.slug}` : '/app';

  const value = useMemo(() => {
    if (!data) {
      return {
        projects: [], inquiries: [], ideas: [], reviews: [], clients: [], payments: [], publishing: [], activity: [],
        projectMembers: [], team: [], notifications: [],
        role: perm.role, actor, perm, can, dispatch, convertInquiry, media: MEDIA, stages, paymentStatus,
        mode: 'live', isDemo: false, basePath, href: (p) => `${basePath}${p.startsWith('/') ? p : `/${p}`}`,
        workspace, memberships, loading, error, reload: load, signOut, all: { projects: [] },
      };
    }
    return {
      ...data,
      all: data,
      role: perm.role,
      actor,
      perm,
      can,
      dispatch,
      convertInquiry,
      resetDemo: () => {},
      setRole: () => {},
      media: MEDIA,
      stages,
      paymentStatus,
      mode: 'live',
      isDemo: false,
      basePath,
      href: (p) => `${basePath}${p.startsWith('/') ? p : `/${p}`}`,
      workspace,
      memberships,
      loading,
      error,
      reload: load,
      signOut,
    };
  }, [data, perm, actor, can, dispatch, convertInquiry, basePath, workspace, memberships, loading, error, load, signOut]);

  if (loading && !data) {
    return <div className="page"><span className="eyebrow">KADRI</span><h1>Opening workspace…</h1></div>;
  }
  if (error) {
    return (
      <div className="page">
        <span className="eyebrow">ACCESS</span>
        <h1>{error}</h1>
      </div>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
