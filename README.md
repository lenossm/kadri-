# KADRI — Creative Production OS

KADRI is a portfolio concept for the operational side of a creative production studio. The public landing page is cinematic, while the internal workspace focuses on inquiries, pipeline, project records, video review, ideas, clients, payments, publishing and a simplified client portal.

The project is intentionally built as a real React application rather than a collection of static design screenshots. All visible workspace screens are rendered from components and structured data. Demo edits are persisted to `localStorage`.

## Stack

- React
- Vite
- React Router
- GSAP
- Lucide React
- CSS

## Working demo flows

- Create an inquiry.
- Convert an inquiry into a project.
- Move a project through production stages.
- Edit a project brief.
- Add ideas to the Idea Pool.
- Open the Screening Room and play a real local video.
- Add a timecoded review comment and click comments to seek the video.
- Approve a version or request changes.
- Search projects, inquiries, ideas and reviews with `Ctrl/Cmd + K`.
- Preview a project in the client portal.
- Prepare a public publishing draft.

## Local development

```bash
npm install
npm run dev
```

Vite is configured to use port `4173`.

## Production

```bash
npm run build
npm run preview
```

## Media

`public/media/kadri-review.mp4` is the browser-friendly review film. A 3840×2160 master is kept at `public/media/master/kadri-review-4k.mp4` and is selected for the landing hero on very large displays.

## Data architecture

Demo data lives in `src/data/fixtures.js`, while mutable workspace state is owned by `WorkspaceContext`. That separation is deliberate: a later Laravel API could replace local data without requiring the UI components to be redesigned.

## Note

This is an independent portfolio concept. Client and project names are fictional unless stated otherwise.
