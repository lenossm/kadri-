export const stages = ['Inquiry', 'Brief', 'Pre-production', 'Production', 'Post', 'Client review', 'Delivered'];

export const initialProjects = [
  { id: 'night-shift', title: 'Night Shift', type: 'Commercial Film', location: 'Tbilisi', stage: 'Post', due: '14 Aug', owner: 'Nini', progress: 78, budget: 24000, client: 'Veli Studio', brief: 'A nocturnal brand film built around reflective surfaces, sodium light and restrained movement.', status: 'Active' },
  { id: 'room-tone', title: 'Room Tone', type: 'Video Podcast', location: 'Tbilisi', stage: 'Client review', due: '16 Aug', owner: 'Mariam', progress: 91, budget: 9800, client: 'Open Channel', brief: 'Three-camera studio conversation with a modular visual identity and social cutdowns.', status: 'Review' },
  { id: 'rioni', title: 'Rioni', type: 'Documentary', location: 'Kutaisi', stage: 'Production', due: '23 Aug', owner: 'Sandro', progress: 52, budget: 18000, client: 'Independent', brief: 'A short observational film following one river through work, memory and changing city edges.', status: 'Active' },
  { id: 'mzi', title: 'Mzi', type: 'Fashion Film', location: 'Batumi', stage: 'Pre-production', due: '29 Aug', owner: 'Elene', progress: 34, budget: 15000, client: 'MZI Atelier', brief: 'Editorial fashion film with hard daylight, architectural framing and fast tactile inserts.', status: 'Planning' },
];

export const initialInquiries = [
  { id: 'inq-1', company: 'Nari Objects', person: 'Ana K.', email: 'ana@nari.example', type: 'Commercial Film', budget: '15–25K', timeline: 'September', message: 'Launching a new furniture collection. Looking for one hero film and six cutdowns.', status: 'New', source: 'Website' },
  { id: 'inq-2', company: 'Sakheli', person: 'Gio M.', email: 'gio@sakheli.example', type: 'Motion / Titles', budget: '5–10K', timeline: '3 weeks', message: 'Need a title system and short identity package for an independent film programme.', status: 'Reviewing', source: 'Referral' },
  { id: 'inq-3', company: 'Studio 44', person: 'Maka L.', email: 'maka@studio44.example', type: 'Podcast / Studio', budget: 'Let’s discuss', timeline: 'October', message: 'Weekly video podcast, two-camera minimum, edit and social deliverables.', status: 'Qualified', source: 'Instagram' },
];

export const initialIdeas = [
  { id: 'idea-1', title: 'Bus window portraits', body: 'Shoot faces through wet bus windows after midnight. Reflections do most of the transition work.', type: 'Film', tags: ['night', 'portrait'] },
  { id: 'idea-2', title: 'One-room interview', body: 'No coverage. One slow lens move during the entire conversation. Let silence carry the cuts.', type: 'Studio', tags: ['interview'] },
  { id: 'idea-3', title: 'Concrete / textile', body: 'Fashion textures against brutalist stairwells. Macro fibers become match cuts into architecture.', type: 'Fashion', tags: ['texture', 'location'] },
  { id: 'idea-4', title: 'Three-minute city', body: 'A day in Tbilisi compressed into one continuous sound bed with abrupt visual time jumps.', type: 'Documentary', tags: ['city', 'sound'] },
  { id: 'idea-5', title: 'Billboard at dawn', body: 'Outdoor campaign photographed only during the fifteen minutes before sunrise.', type: 'Outdoor', tags: ['OOH', 'dawn'] },
];

export const initialReviews = [
  { id: 'review-1', projectId: 'room-tone', title: 'Room Tone — Episode 03', version: 'V4', status: 'Waiting', due: 'Today', comments: [
    { id: 'c1', time: 8.2, author: 'Client', text: 'Can we hold this frame slightly longer?' },
    { id: 'c2', time: 18.5, author: 'Nini', text: 'I would keep the silence here. It makes the next answer land.' },
  ]},
  { id: 'review-2', projectId: 'night-shift', title: 'Night Shift — Master', version: 'V7', status: 'Changes', due: 'Tomorrow', comments: [] },
];

export const clients = [
  { id: 'client-1', name: 'Veli Studio', contact: 'Nata G.', projects: 3, value: 48000, last: 'Today' },
  { id: 'client-2', name: 'Open Channel', contact: 'Dato R.', projects: 5, value: 61500, last: 'Yesterday' },
  { id: 'client-3', name: 'MZI Atelier', contact: 'Mariam T.', projects: 2, value: 25500, last: '4 days ago' },
  { id: 'client-4', name: 'Independent', contact: 'Multiple', projects: 4, value: 22000, last: '1 week ago' },
];

export const payments = [
  { id: 'pay-1', project: 'Night Shift', invoice: 'INV-042', amount: 12000, due: '12 Aug', status: 'Paid' },
  { id: 'pay-2', project: 'Room Tone', invoice: 'INV-043', amount: 4900, due: '18 Aug', status: 'Pending' },
  { id: 'pay-3', project: 'Rioni', invoice: 'INV-044', amount: 9000, due: '22 Aug', status: 'Pending' },
  { id: 'pay-4', project: 'Mzi', invoice: 'INV-045', amount: 7500, due: '01 Sep', status: 'Draft' },
];
