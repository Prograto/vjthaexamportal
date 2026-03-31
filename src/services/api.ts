import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const requestUrl = String(error?.config?.url || '');
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login:    (payload: { email?: string; regNo?: string; password: string }) => api.post('/auth/login', payload),
  register: (data: any)   => api.post('/auth/register', data),
  verify:   ()            => api.get('/auth/verify'),
  logout:   ()            => api.post('/auth/logout'),
};

export const examAPI = {
  getAll:        ()                          => api.get('/exams'),
  getPublished:  ()                          => api.get('/exams?published=true'),
  getById:       (id: string)                => api.get(`/exams/${id}`),
  create:        (data: any)                 => api.post('/exams', data),
  update:        (id: string, data: any)     => api.put(`/exams/${id}`, data),
  delete:        (id: string)                => api.delete(`/exams/${id}`),
  publish:       (id: string)                => api.put(`/exams/${id}/publish`, {}),
  unpublish:     (id: string)                => api.put(`/exams/${id}/unpublish`, {}),
  addSection:    (id: string, data: any)     => api.post(`/exams/${id}/sections`, data),
  updateSection: (id: string, secId: string, data: any) => api.put(`/exams/${id}/sections/${secId}`, data),
  deleteSection: (id: string, secId: string) => api.delete(`/exams/${id}/sections/${secId}`),
};

export const questionAPI = {
  getByExamAndSection: (examId: string, sectionId: string) =>
    api.get(`/questions/exam/${examId}/section/${sectionId}`),
  getByExam: (examId: string) => api.get(`/questions/exam/${examId}`),

  create: (data: any, imageFile?: File | null) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null)
        form.append(k, typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : String(typeof v === 'object' ? JSON.stringify(v) : v));
    });
    if (imageFile) form.append('image', imageFile);
    return api.post('/questions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  bulkUpload: (file: File, examId: string, sectionId: string) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/questions/bulk-upload?examId=${examId}&sectionId=${sectionId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  imageUrl: (id: string) => `${api.defaults.baseURL}/questions/${id}/image`,
  update: (id: string, data: any) => api.put(`/questions/${id}`, data),
  delete: (id: string)            => api.delete(`/questions/${id}`),
};

export const attemptAPI = {
  getStudentResults: (studentId: string)       => api.get(`/attempts/student/${studentId}`),
  getById:           (id: string)              => api.get(`/attempts/${id}`),
  getReview:         (id: string)              => api.get(`/attempts/${id}/review`),
  getAttemptCount:   (examId: string)          => api.get(`/attempts/count?examId=${examId}`),
  create:            (data: any)               => api.post('/attempts', data),
  update:            (id: string, data: any)   => api.put(`/attempts/${id}`, data),
  submit:            (id: string)              => api.post(`/attempts/${id}/submit`),
  getExamStats:      (examId: string)          => api.get(`/attempts/exam/${examId}/stats`),
};

export const resultsAPI = {
  getAdminResults: (params: { collegeId?: string; course?: string; branch?: string; examId?: string }) =>
    api.get('/attempts/admin/results', { params }),
  deleteResult: (attemptId: string) => api.delete(`/attempts/${attemptId}`),
};

export const userAPI = {
  getAll:              ()                                    => api.get('/users'),
  getByCollege:        (collegeId: string)                   => api.get(`/users/college/${collegeId}`),
  create:              (data: any)                           => api.post('/users', data),
  update:              (id: string, data: any)               => api.put(`/users/${id}`, data),
  delete:              (id: string)                          => api.delete(`/users/${id}`),
  getAllColleges:       ()                                    => api.get('/users/colleges/all'),
  getCoursesBranches:  ()                                    => api.get('/users/students/courses-branches'),
  createCollege:       (data: any)                           => api.post('/users/colleges', data),
  deleteCollege:       (id: string)                          => api.delete(`/users/colleges/${id}`),
  toggleCollegeAccess: (id: string, isAccessGranted: boolean) => api.patch(`/users/colleges/${id}/access`, { isAccessGranted }),
  getCollegeStats:     (id: string)                          => api.get(`/users/stats/${id}`),
  bulkUploadStudents:  (file: File, collegeId: string)       => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/users/students/bulk-upload?collegeId=${collegeId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Materials (PDF / PPT) ──────────────────────────────────────────────────────
// Files are now stored on S3. Upload uses multipart/form-data.
// The response contains s3Url — use that directly to view/download.
export const materialAPI = {
  getAll:  (type?: 'pdf' | 'ppt') => api.get('/materials', { params: type ? { type } : {} }),
  getById: (id: string)            => api.get(`/materials/${id}`),

  // Upload a real File object as multipart — no more base64 conversion
  upload: (
    file: File,
    meta: {
      title?: string;
      category?: string;
      accessColleges?: string[];
      accessCourses?: string[];
      accessBranches?: string[];
    },
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (meta.title)    form.append('title',    meta.title);
    if (meta.category) form.append('category', meta.category);
    form.append('accessColleges', JSON.stringify(meta.accessColleges || []));
    form.append('accessCourses',  JSON.stringify(meta.accessCourses  || []));
    form.append('accessBranches', JSON.stringify(meta.accessBranches || []));
    return api.post('/materials', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },

  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string)            => api.delete(`/materials/${id}`),
  createFromUrl: (
    payload: {
      sourceUrl: string;
      type: 'pdf' | 'ppt';
      title?: string;
      category?: string;
      accessColleges?: string[];
      accessCourses?: string[];
      accessBranches?: string[];
    }
  ) => api.post('/materials', payload),
};

export default api;

export const mediaCategoryAPI = {
  getAll:  (params?: { active?: boolean }) => api.get('/media-categories', { params }),
  getById: (id: string) => api.get(`/media-categories/${id}`),
  create:  (data: { name: string; description?: string }) => api.post('/media-categories', data),
  update:  (id: string, data: any) => api.put(`/media-categories/${id}`, data),
  delete:  (id: string) => api.delete(`/media-categories/${id}`),
};

// ── Media Gallery ──────────────────────────────────────────────────────────────
// Files now live on S3. s3Url is returned in each item — use it directly.
export const mediaGalleryAPI = {
  getAll:   (params?: { active?: boolean; type?: string; categoryId?: string }) =>
    api.get('/media-gallery', { params }),
  getById:  (id: string) => api.get(`/media-gallery/${id}`),

  // bulkCreate — sends files directly as multipart to the backend → S3
  bulkCreate: (
    files: File[],
    meta: { categoryId: string; description?: string },
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('categoryId',  meta.categoryId);
    form.append('description', meta.description || '');
    return api.post('/media-gallery/bulk', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  update: (id: string, data: any) => api.put(`/media-gallery/${id}`, data),
  delete: (id: string) => api.delete(`/media-gallery/${id}`),
  createFromUrl: (payload: {
    categoryId: string;
    sourceUrl: string;
    mediaType: 'image' | 'video';
    title?: string;
    description?: string;
  }) => api.post('/media-gallery/url', payload),
};

// ── Magazines ─────────────────────────────────────────────────────────────────
// PDF now stored on S3. Response includes s3Url — use it directly for viewing.
export const magazineAPI = {
  getAll:  (params?: { active?: boolean }) => api.get('/magazines', { params }),
  getById: (id: string)                    => api.get(`/magazines/${id}`),

  create: (
    file: File,
    meta: {
      title: string;
      description?: string;
      edition?: string;
      order?: number;
      category?: string;
      accessColleges?: string[];
      accessCourses?: string[];
      accessBranches?: string[];
    }
  ) => {
    const form = new FormData();
    form.append('file',           file);
    form.append('title',          meta.title);
    form.append('description',    meta.description || '');
    form.append('edition',        meta.edition || '');
    form.append('order',          String(meta.order ?? 0));
    form.append('category',       meta.category || '');
    form.append('accessColleges', JSON.stringify(meta.accessColleges || []));
    form.append('accessCourses',  JSON.stringify(meta.accessCourses  || []));
    form.append('accessBranches', JSON.stringify(meta.accessBranches || []));
    return api.post('/magazines', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  update: (id: string, data: any) => api.put(`/magazines/${id}`, data),
  delete: (id: string) => api.delete(`/magazines/${id}`),
  createFromUrl: (
    payload: {
      sourceUrl: string;
      title: string;
      description?: string;
      edition?: string;
      order?: number;
      category?: string;
      accessColleges?: string[];
      accessCourses?: string[];
      accessBranches?: string[];
    }
  ) => api.post('/magazines', payload),
};

// ── Ads ───────────────────────────────────────────────────────────────────────
// Media now stored on S3. Response includes s3Url — use it directly for display.
export const adAPI = {
  getAll:  (params?: { active?: boolean; type?: 'image' | 'video' }) =>
    api.get('/ads', { params }),
  getById: (id: string) => api.get(`/ads/${id}`),

  create: (
    file: File,
    meta: { title: string; description?: string; order?: number; displayMinutes?: number }
  ) => {
    const form = new FormData();
    form.append('file',           file);
    form.append('title',          meta.title);
    form.append('description',    meta.description || '');
    form.append('order',          String(meta.order ?? 0));
    form.append('displayMinutes', String(meta.displayMinutes ?? 30));
    return api.post('/ads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  update: (id: string, data: any) => api.put(`/ads/${id}`, data),
  delete: (id: string) => api.delete(`/ads/${id}`),
};
