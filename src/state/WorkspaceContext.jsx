import { createContext, useContext, useMemo, useReducer } from 'react';
import { initialIdeas, initialInquiries, initialProjects, initialReviews } from '../data/fixtures';

const WorkspaceContext = createContext(null);
const STORAGE_KEY = 'kadri-workspace-v1';

function loadInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { projects: initialProjects, inquiries: initialInquiries, ideas: initialIdeas, reviews: initialReviews };
}

function reducer(state, action) {
  let next = state;
  switch (action.type) {
    case 'ADD_INQUIRY':
      next = { ...state, inquiries: [{ ...action.payload, id: `inq-${Date.now()}`, status: 'New', source: 'Manual' }, ...state.inquiries] };
      break;
    case 'SET_INQUIRY_STATUS':
      next = { ...state, inquiries: state.inquiries.map((x) => x.id === action.id ? { ...x, status: action.status } : x) };
      break;
    case 'CONVERT_INQUIRY': {
      const inquiry = state.inquiries.find((x) => x.id === action.id);
      if (!inquiry) return state;
      const project = {
        id: `${inquiry.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        title: inquiry.company,
        type: inquiry.type,
        location: 'Tbilisi',
        stage: 'Brief',
        due: action.due || 'TBD',
        owner: action.owner || 'Elene',
        progress: 12,
        budget: Number(String(inquiry.budget).replace(/\D/g, '').slice(0, 5)) || 0,
        client: inquiry.company,
        brief: inquiry.message,
        status: 'Active',
      };
      next = {
        ...state,
        projects: [project, ...state.projects],
        inquiries: state.inquiries.map((x) => x.id === action.id ? { ...x, status: 'Converted' } : x),
      };
      break;
    }
    case 'MOVE_PROJECT':
      next = { ...state, projects: state.projects.map((x) => x.id === action.id ? { ...x, stage: action.stage, progress: action.progress ?? x.progress } : x) };
      break;
    case 'UPDATE_PROJECT':
      next = { ...state, projects: state.projects.map((x) => x.id === action.id ? { ...x, ...action.patch } : x) };
      break;
    case 'ADD_IDEA':
      next = { ...state, ideas: [{ ...action.payload, id: `idea-${Date.now()}` }, ...state.ideas] };
      break;
    case 'ADD_REVIEW_COMMENT':
      next = { ...state, reviews: state.reviews.map((x) => x.id === action.id ? { ...x, comments: [...x.comments, { ...action.payload, id: `c-${Date.now()}` }] } : x) };
      break;
    case 'SET_REVIEW_STATUS':
      next = { ...state, reviews: state.reviews.map((x) => x.id === action.id ? { ...x, status: action.status } : x) };
      break;
    case 'RESET':
      next = { projects: initialProjects, inquiries: initialInquiries, ideas: initialIdeas, reviews: initialReviews };
      break;
    default:
      return state;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
