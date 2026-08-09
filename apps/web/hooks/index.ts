'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useProjects(userId?: string) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: () => api.projects.list(userId),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.projects.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.projects.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useAssets(projectId: string) {
  return useQuery({
    queryKey: ['assets', projectId],
    queryFn: () => api.assets.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      api.assets.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['assets', projectId] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, assetId, data }: { projectId: string; assetId: string; data: any }) =>
      api.assets.update(projectId, assetId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['assets', projectId] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, assetId }: { projectId: string; assetId: string }) =>
      api.assets.delete(projectId, assetId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['assets', projectId] });
    },
  });
}

export function useClips(projectId: string) {
  return useQuery({
    queryKey: ['clips', projectId],
    queryFn: () => api.clips.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateClip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      api.clips.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clips', projectId] });
    },
  });
}

export function useUpdateClip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, clipId, data }: { projectId: string; clipId: string; data: any }) =>
      api.clips.update(projectId, clipId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clips', projectId] });
    },
  });
}

export function useDeleteClip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, clipId }: { projectId: string; clipId: string }) =>
      api.clips.delete(projectId, clipId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clips', projectId] });
    },
  });
}

export function useOperations(projectId: string, params?: { status?: string; clipId?: string }) {
  return useQuery({
    queryKey: ['operations', projectId, params],
    queryFn: () => api.operations.list(projectId, params),
    enabled: !!projectId,
  });
}

export function useCreateOperation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      api.operations.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['operations', projectId] });
    },
  });
}

export function useUpdateOperation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, operationId, data }: { projectId: string; operationId: string; data: any }) =>
      api.operations.update(projectId, operationId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['operations', projectId] });
    },
  });
}

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, operationId }: { projectId: string; operationId: string }) =>
      api.operations.delete(projectId, operationId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['operations', projectId] });
    },
  });
}

export function useTimelines(projectId: string) {
  return useQuery({
    queryKey: ['timelines', projectId],
    queryFn: () => api.timeline.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTimeline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      api.timeline.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', projectId] });
    },
  });
}

export function useUpdateTimeline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, timelineId, data }: { projectId: string; timelineId: string; data: any }) =>
      api.timeline.update(projectId, timelineId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', projectId] });
    },
  });
}

export function useDeleteTimeline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, timelineId }: { projectId: string; timelineId: string }) =>
      api.timeline.delete(projectId, timelineId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['timelines', projectId] });
    },
  });
}

export function useVersions(projectId: string) {
  return useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => api.versions.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      api.versions.create(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
    },
  });
}

export function useAnalyze() {
  return useMutation({
    mutationFn: api.analyze,
  });
}

export function useProcess() {
  return useMutation({
    mutationFn: api.process,
  });
}

export function useRender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.render.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renderJobs'] });
    },
  });
}

export function useRenderStatus(jobId?: string) {
  return useQuery({
    queryKey: ['renderJobs', jobId],
    queryFn: () => api.render.getStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.job?.status === 'rendering') return 1000;
      return false;
    },
  });
}

export function useCancelRender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.render.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renderJobs'] });
    },
  });
}

export function useUpload() {
  return useMutation({
    mutationFn: ({ files, projectId }: { files: File[]; projectId?: string }) =>
      api.upload(files, projectId),
  });
}
