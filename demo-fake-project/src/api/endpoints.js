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
  bulkRemove: (ids) => client.post('/contacts/bulks-delete', { ids }),

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
      params: {format },
    }),

  // POST /api/contacts/import  (multipart/form-data)
  import: (file, categoryOverride, onUploadProgress) => {
    const formData = new FormData();
    formData.append('files', files);

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
  summary: () => client.get('/stat/summary'),

  // GET /api/stats/upcoming-followups?days=2  (ya ?from=&to= date range ke liye)
  upcomingFollowUps: (params = {}) =>
    client.get('/stats/upcoming-followup', {
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
