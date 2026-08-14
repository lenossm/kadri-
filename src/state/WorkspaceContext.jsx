import { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react';
import { createSeedState, MEDIA, stages } from '../data/fixtures';
import { parseBudget, slugify, todayIso } from '../utils/format';
import { paymentStatus } from '../utils/selectors';

const WorkspaceContext = createContext(null);
const STORAGE_KEY = 'kadri_demo_workspace';
const ROLE_KEY = 'kadri_demo_role';
const LEGACY_KEY = 'kadri-workspace-v1';
const STATE_VERSION = 2;

function stamp() {
  return Date.now();
}

function activity(text, projectId = null) {
  return { id: `act-${stamp()}`, at: new Date().toISOString(), text, projectId };
}

function hydrate(parsed) {
  const seed = createSeedState();
  if (!parsed || parsed.version !== STATE_VERSION || !Array.isArray(parsed.projects)) return seed;
  return {
    version: STATE_VERSION,
    projects: parsed.projects ?? seed.projects,
    inquiries: parsed.inquiries ?? seed.inquiries,
    ideas: parsed.ideas ?? seed.ideas,
    reviews: parsed.reviews ?? seed.reviews,
    clients: parsed.clients ?? seed.clients,
    payments: parsed.payments ?? seed.payments,
    publishing: parsed.publishing ?? seed.publishing,
    activity: parsed.activity ?? seed.activity,
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch {}
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
  return createSeedState();
}

function persist(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function progressFor(stage) {
  const i = stages.indexOf(stage);
  if (i < 0) return 12;
  return Math.round(((i + 1) / stages.length) * 100);
}

function statusFor(stage) {
  if (stage === 'Delivered') return 'Delivered';
  if (stage === 'Client review') return 'Review';
  if (stage === 'Inquiry' || stage === 'Brief' || stage === 'Pre-production') return 'Planning';
  return 'Active';
}

function reducer(state, action) {
  let next = state;
  switch (action.type) {
    case 'ADD_INQUIRY': {
      const payload = action.payload;
      const item = {
        id: `inq-${stamp()}`,
        company: String(payload.company || '').trim(),
        person: String(payload.person || '').trim(),
        email: String(payload.email || '').trim(),
        phone: String(payload.phone || '').trim(),
        projectName: String(payload.projectName || payload.company || '').trim(),
        type: payload.type || 'Commercial Film',
        budget: payload.budget || '',
        timeline: payload.timeline || '',
        message: String(payload.message || '').trim(),
        status: 'New',
        source: payload.source || 'Manual',
        createdAt: todayIso(),
        clientId: null,
      };
      next = {
        ...state,
        inquiries: [item, ...state.inquiries],
        activity: [activity(`New inquiry from ${item.company}.`), ...state.activity].slice(0, 40),
      };
      break;
    }
    case 'UPDATE_INQUIRY':
      next = {
        ...state,
        inquiries: state.inquiries.map((x) => x.id === action.id ? { ...x, ...action.patch } : x),
      };
      break;
    case 'SET_INQUIRY_STATUS':
      next = {
        ...state,
        inquiries: state.inquiries.map((x) => x.id === action.id ? { ...x, status: action.status } : x),
      };
      break;
    case 'CONVERT_INQUIRY': {
      const inquiry = state.inquiries.find((x) => x.id === action.id);
      if (!inquiry) return state;
      let clients = state.clients;
      let client = clients.find((c) => c.name.toLowerCase() === inquiry.company.toLowerCase());
      if (!client) {
        client = {
          id: `client-${stamp()}`,
          name: inquiry.company,
          contact: inquiry.person,
          email: inquiry.email,
          phone: inquiry.phone || '',
          last: todayIso(),
        };
        clients = [client, ...clients];
      } else {
        clients = clients.map((c) => c.id === client.id ? { ...c, last: todayIso(), contact: inquiry.person, email: inquiry.email } : c);
      }
      const title = inquiry.projectName || inquiry.company;
      const budget = parseBudget(inquiry.budget);
      const project = {
        id: action.projectId,
        title,
        type: inquiry.type,
        location: 'Tbilisi',
        stage: 'Brief',
        status: 'Planning',
        due: action.due || '',
        start: todayIso(),
        shootDate: '',
        owner: action.owner || 'Elene',
        progress: progressFor('Brief'),
        budget,
        clientId: client.id,
        inquiryId: inquiry.id,
        brief: inquiry.message,
        objective: inquiry.message,
        deliverables: ['Hero film', 'Social cutdowns'],
        direction: '',
        format: '4K · 16:9',
        crew: `Producer ${action.owner || 'Elene'}`,
        notes: `Converted from inquiry on ${todayIso()}.`,
      };
      const payment = budget
        ? {
          id: `pay-${stamp()}`,
          projectId: project.id,
          clientId: client.id,
          invoice: `INV-${200 + state.payments.length + 1}`,
          amount: Math.round(budget * 0.5) || budget,
          issued: todayIso(),
          due: action.due || todayIso(),
          status: 'Draft',
        }
        : null;
      next = {
        ...state,
        clients,
        projects: [project, ...state.projects],
        payments: payment ? [payment, ...state.payments] : state.payments,
        inquiries: state.inquiries.map((x) => x.id === inquiry.id ? { ...x, status: 'Converted', clientId: client.id } : x),
        activity: [activity(`${title} opened from inquiry.`, project.id), ...state.activity].slice(0, 40),
      };
      break;
    }
    case 'MOVE_PROJECT': {
      const project = state.projects.find((x) => x.id === action.id);
      if (!project) return state;
      const stage = action.stage;
      const patch = { stage, progress: action.progress ?? progressFor(stage), status: statusFor(stage) };
      let reviews = state.reviews;
      if (stage === 'Client review' && !reviews.some((r) => r.projectId === project.id)) {
        reviews = [{
          id: `review-${stamp()}`,
          projectId: project.id,
          title: `${project.title} — Cut`,
          version: 'V1',
          status: 'Awaiting Review',
          due: project.due || todayIso(),
          submittedAt: todayIso(),
          comments: [],
        }, ...reviews];
      }
      next = {
        ...state,
        reviews,
        projects: state.projects.map((x) => x.id === action.id ? { ...x, ...patch } : x),
        activity: [activity(`${project.title} moved to ${stage}.`, project.id), ...state.activity].slice(0, 40),
      };
      break;
    }
    case 'UPDATE_PROJECT':
      next = {
        ...state,
        projects: state.projects.map((x) => x.id === action.id ? { ...x, ...action.patch } : x),
      };
      break;
    case 'ADD_IDEA':
      next = {
        ...state,
        ideas: [{
          id: `idea-${stamp()}`,
          title: action.payload.title,
          body: action.payload.body,
          type: action.payload.type || 'Film',
          tags: action.payload.tags || [],
          projectId: action.payload.projectId || null,
          pinned: false,
        }, ...state.ideas],
      };
      break;
    case 'UPDATE_IDEA':
      next = { ...state, ideas: state.ideas.map((x) => x.id === action.id ? { ...x, ...action.patch } : x) };
      break;
    case 'ADD_REVIEW_COMMENT':
      next = {
        ...state,
        reviews: state.reviews.map((x) => x.id === action.id
          ? { ...x, comments: [...x.comments, { id: `c-${stamp()}`, time: action.payload.time, author: action.payload.author, text: action.payload.text }] }
          : x),
        activity: [activity(`Note added on ${state.reviews.find((r) => r.id === action.id)?.title || 'a review'}.`, state.reviews.find((r) => r.id === action.id)?.projectId), ...state.activity].slice(0, 40),
      };
      break;
    case 'SET_REVIEW_STATUS': {
      const review = state.reviews.find((x) => x.id === action.id);
      if (!review) return state;
      let reviews = state.reviews.map((x) => x.id === action.id ? { ...x, status: action.status } : x);
      if (action.note) {
        reviews = reviews.map((x) => x.id === action.id
          ? { ...x, comments: [...x.comments, { id: `c-${stamp()}`, time: action.time ?? 0, author: action.author || 'Elene', text: action.note }] }
          : x);
      }
      let projects = state.projects;
      if (action.status === 'Approved') {
        projects = projects.map((p) => p.id === review.projectId ? { ...p, status: p.stage === 'Delivered' ? 'Delivered' : 'Review' } : p);
      }
      if (action.status === 'Changes Requested') {
        projects = projects.map((p) => p.id === review.projectId ? { ...p, status: 'Active', stage: p.stage === 'Delivered' ? p.stage : 'Post' } : p);
      }
      next = {
        ...state,
        reviews,
        projects,
        activity: [activity(`${review.title} marked ${action.status}.`, review.projectId), ...state.activity].slice(0, 40),
      };
      break;
    }
    case 'SET_PAYMENT_STATUS': {
      const payment = state.payments.find((x) => x.id === action.id);
      if (!payment) return state;
      next = {
        ...state,
        payments: state.payments.map((x) => x.id === action.id ? { ...x, status: action.status } : x),
        activity: [activity(`${payment.invoice} marked ${action.status}.`, payment.projectId), ...state.activity].slice(0, 40),
      };
      break;
    }
    case 'SET_PUBLISHING':
      next = {
        ...state,
        publishing: state.publishing.map((x) => x.id === action.id ? { ...x, ...action.patch } : x),
      };
      break;
    case 'ADD_PUBLISHING': {
      const item = {
        id: `pub-${stamp()}`,
        projectId: action.payload.projectId,
        publicTitle: action.payload.publicTitle,
        category: action.payload.category || 'Film',
        destination: action.payload.destination || 'Client Drive',
        planned: action.payload.planned || todayIso(),
        status: action.payload.status || 'Scheduled',
        featured: Boolean(action.payload.featured),
      };
      next = { ...state, publishing: [item, ...state.publishing] };
      break;
    }
    case 'RESET':
      next = createSeedState();
      break;
    default:
      return state;
  }
  return persist(next);
}

function scopeState(state, role) {
  if (role !== 'client') return state;
  const clientId = 'client-northline';
  const projects = state.projects.filter((p) => p.clientId === clientId);
  const ids = new Set(projects.map((p) => p.id));
  return {
    ...state,
    projects,
    reviews: state.reviews.filter((r) => ids.has(r.projectId)),
    payments: state.payments.filter((p) => p.clientId === clientId),
    publishing: state.publishing.filter((p) => ids.has(p.projectId)),
    inquiries: [],
    ideas: state.ideas.filter((i) => !i.projectId || ids.has(i.projectId)),
    activity: state.activity.filter((a) => !a.projectId || ids.has(a.projectId)),
    clients: state.clients.filter((c) => c.id === clientId),
  };
}

function loadRole() {
  try {
    const role = localStorage.getItem(ROLE_KEY);
    if (role === 'producer' || role === 'editor' || role === 'client') return role;
  } catch {}
  return 'producer';
}

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [role, setRoleState] = useState(loadRole);

  const setRole = useCallback((next) => {
    setRoleState(next);
    try { localStorage.setItem(ROLE_KEY, next); } catch {}
  }, []);

  const convertInquiry = useCallback((id, extras = {}) => {
    const inquiry = state.inquiries.find((x) => x.id === id);
    if (!inquiry) return null;
    const projectId = extras.projectId || `${slugify(inquiry.projectName || inquiry.company)}-${stamp()}`;
    dispatch({ type: 'CONVERT_INQUIRY', id, projectId, owner: extras.owner, due: extras.due });
    return projectId;
  }, [state.inquiries]);

  const resetDemo = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_KEY); } catch {}
    dispatch({ type: 'RESET' });
  }, []);

  const view = useMemo(() => scopeState(state, role), [state, role]);

  const value = useMemo(() => ({
    ...view,
    all: state,
    role,
    setRole,
    dispatch,
    convertInquiry,
    resetDemo,
    media: MEDIA,
    stages,
    paymentStatus,
  }), [view, state, role, setRole, convertInquiry, resetDemo]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
