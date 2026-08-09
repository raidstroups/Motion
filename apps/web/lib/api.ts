const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  projects: {
    list: (userId?: string) =>
      fetchAPI<{ success: boolean; projects: any[] }>(
        `/projects${userId ? `?userId=${userId}` : ''}`
      ),
    
    get: (id: string) =>
      fetchAPI<{ success: boolean; project: any }>(`/projects/${id}`),
    
    create: (data: { name: string; description?: string; settings: any }) =>
      fetchAPI<{ success: boolean; project: any }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: Partial<{ name: string; description: string; settings: any }>) =>
      fetchAPI<{ success: boolean; project: any }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      fetchAPI<{ success: boolean }>(`/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  assets: {
    list: (projectId: string, type?: string) =>
      fetchAPI<{ success: boolean; assets: any[] }>(
        `/projects/${projectId}/assets${type ? `?type=${type}` : ''}`
      ),
    
    create: (projectId: string, data: any) =>
      fetchAPI<{ success: boolean; asset: any }>(`/projects/${projectId}/assets`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (projectId: string, assetId: string, data: Partial<any>) =>
      fetchAPI<{ success: boolean; asset: any }>(
        `/projects/${projectId}/assets?assetId=${assetId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    
    delete: (projectId: string, assetId: string) =>
      fetchAPI<{ success: boolean }>(
        `/projects/${projectId}/assets?assetId=${assetId}`,
        { method: 'DELETE' }
      ),
  },

  clips: {
    list: (projectId: string) =>
      fetchAPI<{ success: boolean; clips: any[] }>(`/projects/${projectId}/clips`),
    
    create: (projectId: string, data: any) =>
      fetchAPI<{ success: boolean; clip: any }>(`/projects/${projectId}/clips`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (projectId: string, clipId: string, data: Partial<any>) =>
      fetchAPI<{ success: boolean; clip: any }>(
        `/projects/${projectId}/clips?clipId=${clipId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    
    delete: (projectId: string, clipId: string) =>
      fetchAPI<{ success: boolean }>(
        `/projects/${projectId}/clips?clipId=${clipId}`,
        { method: 'DELETE' }
      ),
  },

  operations: {
    list: (projectId: string, params?: { status?: string; clipId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.clipId) searchParams.set('clipId', params.clipId);
      const query = searchParams.toString();
      return fetchAPI<{ success: boolean; operations: any[] }>(
        `/projects/${projectId}/operations${query ? `?${query}` : ''}`
      );
    },
    
    create: (projectId: string, data: any) =>
      fetchAPI<{ success: boolean; operation: any }>(`/projects/${projectId}/operations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (projectId: string, operationId: string, data: Partial<any>) =>
      fetchAPI<{ success: boolean; operation: any }>(
        `/projects/${projectId}/operations?operationId=${operationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    
    delete: (projectId: string, operationId: string) =>
      fetchAPI<{ success: boolean }>(
        `/projects/${projectId}/operations?operationId=${operationId}`,
        { method: 'DELETE' }
      ),
  },

  timeline: {
    list: (projectId: string) =>
      fetchAPI<{ success: boolean; timelines: any[] }>(`/projects/${projectId}/timeline`),
    
    create: (projectId: string, data: any) =>
      fetchAPI<{ success: boolean; timeline: any }>(`/projects/${projectId}/timeline`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (projectId: string, timelineId: string, data: Partial<any>) =>
      fetchAPI<{ success: boolean; timeline: any }>(
        `/projects/${projectId}/timeline?timelineId=${timelineId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    
    delete: (projectId: string, timelineId: string) =>
      fetchAPI<{ success: boolean }>(
        `/projects/${projectId}/timeline?timelineId=${timelineId}`,
        { method: 'DELETE' }
      ),
  },

  versions: {
    list: (projectId: string) =>
      fetchAPI<{ success: boolean; versions: any[] }>(`/projects/${projectId}/versions`),
    
    create: (projectId: string, data: any) =>
      fetchAPI<{ success: boolean; version: any }>(`/projects/${projectId}/versions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  upload: async (files: File[], projectId?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (projectId) formData.append('projectId', projectId);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  analyze: (data: { projectId: string; assetId: string; assetPath: string }) =>
    fetchAPI<{ success: boolean; analysis: any; videoInfo: any }>('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  process: (data: { projectId: string; instruction: string; videoAnalysis?: any }) =>
    fetchAPI<{ success: boolean; editPlan: any; operationCount: number }>('/process', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  render: {
    start: (data: any) =>
      fetchAPI<{ success: boolean; jobId: string; status: string }>('/render', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getStatus: (jobId?: string) =>
      fetchAPI<{ success: boolean; job?: any; jobs?: any[] }>(
        `/render${jobId ? `?jobId=${jobId}` : ''}`
      ),
    
    cancel: (jobId: string) =>
      fetchAPI<{ success: boolean }>(`/render?jobId=${jobId}`, {
        method: 'DELETE',
      }),
  },
};
