import client from './client';

/**
 * Saare backend API calls ek hi jagah par.
 * Component me sirf `import { contactsApi } from '../api/endpoints'` karein.
 */

/* ----------------------------- AUTH ----------------------------- */
export const authApi = {
  // POST /api/auth/login
  login: (username, password) => client.post('/auth/login', { username, password }),

  // GET /api/auth/me
  me: () => client.get('/auth/me'),
};

/* --------------------------- CONTACTS --------------------------- */
export const contactsApi = {
  // GET /api/contacts?page=&limit=&category=&status=&city=&search=&hasEmail=
  list: (params = {}) => client.get('/contacts', { params }),

  // GET /api/contacts/:id
  getById: (id) => client.get(`/contacts/${id}`),

  // POST /api/contacts
  create: (payload) => client.post('/contacts', payload),

  // PUT /api/contacts/:id
  update: (id, payload) => client.put(`/contacts/${id}`, payload),

  // PATCH /api/contacts/:id/status
  updateStatus: (id, status) => client.patch(`/contacts/${id}/status`, { status }),

  // DELETE /api/contacts/:id
  remove: (id) => client.delete(`/contacts/${id}`),

  // POST /api/contacts/bulk-delete
  bulkRemove: (ids) => client.post('/contacts/bulk-delete', { ids }),

  // GET /api/contacts/filters/options
  filterOptions: () => client.get('/contacts/filters/options'),

  // GET /api/contacts/:id/template?type=&senderName=&senderTitle=
  template: (id, params = {}) => client.get(`/contacts/${id}/template`, { params }),

  // POST /api/contacts/:id/send-email  — app khud email bhejti hai
  sendEmail: (id, payload) => client.post(`/contacts/${id}/send-email`, payload),

  // GET /api/email/test — SMTP settings theek hain ya nahi
  testEmail: () => client.get('/email/test'),

  // GET /api/contacts/export?format=csv|xlsx|pdf  (wohi filters jo list par lage hain)
  download: (params = {}, format = 'csv') =>
    client.get('/contacts/export', {
      params: { ...params, format },
      responseType: 'blob',
    }),

  // POST /api/contacts/import  (multipart/form-data)
  import: (file, categoryOverride, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    if (categoryOverride) {
      formData.append('categoryOverride', categoryOverride);
    }

    return client.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
};

/* ---------------------------- STATS ----------------------------- */
export const statsApi = {
  // GET /api/stats/summary
  summary: () => client.get('/stats/summary'),

  // GET /api/stats/upcoming-followups?days=2  (ya ?from=&to= date range ke liye)
  upcomingFollowUps: (params = {}) =>
    client.get('/stats/upcoming-followups', {
      params: { days: 2, limit: 50, ...params },
    }),
};

/* ---------------------------- INBOX ----------------------------- */
export const inboxApi = {
  // POST /api/inbox/check-replies -- inbox parh kar naye replies dhoondta hai
  checkReplies: () => client.post('/inbox/check-replies'),

  // GET /api/inbox/replies?unreadOnly=&includeAuto=
  replies: (params = {}) => client.get('/inbox/replies', { params }),

  // PATCH /api/contacts/:id/replies/read
  markRead: (id) => client.patch('/contacts/' + id + '/replies/read'),

  // DELETE /api/contacts/:id/replies -- messageId de to sirf wohi, warna saari
  deleteReply: (id, messageId) =>
    client.delete('/contacts/' + id + '/replies', {
      data: messageId ? { messageId } : {},
    }),
};

/* -------------------------- TEMPLATES --------------------------- */
export const templatesApi = {
  // GET /api/templates
  all: () => client.get('/templates'),
};

/* --------------------------- LINKEDIN --------------------------- */
/**
 * LinkedIn Dashboard ka poora API.
 *
 * `playbook` ek hi dafa aata hai aur us me saara tay-shuda content hota hai
 * (stages, targets, message templates, qawaid) -- is liye frontend me kuch
 * bhi hardcode nahi karna parta.
 */
export const linkedinApi = {
  // GET /api/linkedin/playbook
  playbook: () => client.get('/linkedin/playbook'),

  // GET /api/linkedin/stats
  stats: (params = {}) => client.get('/linkedin/stats', { params }),

  /* ---- Pipeline ---- */
  buyers: (params = {}) => client.get('/linkedin/buyers', { params }),
  buyer: (id) => client.get('/linkedin/buyers/' + id),
  createBuyer: (payload) => client.post('/linkedin/buyers', payload),
  updateBuyer: (id, payload) => client.put('/linkedin/buyers/' + id, payload),
  deleteBuyer: (id) => client.delete('/linkedin/buyers/' + id),

  // Bulk delete -- { ids: [...] } ya { all: true, ...filters }
  bulkDeleteBuyers: (payload) => client.post('/linkedin/buyers/bulk-delete', payload),

  /* ---- Poora backup (Excel) ---- */
  // Sirf list nahi -- activity, Ask Zain, reports aur daily bhi
  backup: () => client.get('/linkedin/backup', { responseType: 'blob' }),

  restore: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/linkedin/restore', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Outreach ka "Mark as sent"
  logActivity: (id, payload) =>
    client.post('/linkedin/buyers/' + id + '/activity', payload),

  // GET /api/linkedin/buyers/export (wohi filters jo list par lage hain)
  exportBuyers: (params = {}) =>
    client.get('/linkedin/buyers/export', { params, responseType: 'blob' }),

  importBuyers: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post('/linkedin/buyers/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /* ---- Rozana ka mamool ---- */
  day: (params = {}) => client.get('/linkedin/day', { params }),
  updateDay: (payload) => client.patch('/linkedin/day', payload),

  /* ---- Ask Zain ---- */
  questions: (params = {}) => client.get('/linkedin/questions', { params }),
  createQuestion: (payload) => client.post('/linkedin/questions', payload),
  answerQuestion: (id, payload) => client.patch('/linkedin/questions/' + id, payload),
  deleteQuestion: (id) => client.delete('/linkedin/questions/' + id),

  /* ---- Hafte ki report ---- */
  reportPreview: (params = {}) => client.get('/linkedin/report/preview', { params }),
  saveReport: (payload) => client.post('/linkedin/report', payload),
  reports: () => client.get('/linkedin/reports'),

  // DELETE /api/linkedin/reports/:id (sirf report jati hai, activity nahi)
  deleteReport: (id) => client.delete('/linkedin/reports/' + id),
};
