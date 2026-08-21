import { upload } from '@vercel/blob/client';
import apiClient from '../utils/apiClient';

const useDirectBlob =
  process.env.NODE_ENV === 'production' ||
  process.env.REACT_APP_USE_PRODUCTION_API === 'true';

function uploadWithXhr(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('video', file);

    xhr.timeout = 15 * 60 * 1000;

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const done = event.loaded >= event.total && event.total > 0;
      onProgress({
        percent: done ? 100 : Math.min(99, Math.round((event.loaded / event.total) * 100)),
        loaded: event.loaded,
        total: event.total,
        stage: done ? 'processing' : 'upload',
      });
    });

    xhr.upload.addEventListener('load', () => {
      onProgress?.({
        percent: 100,
        loaded: file.size,
        total: file.size,
        stage: 'processing',
      });
    });

    xhr.addEventListener('load', () => {
      let result;
      try {
        result = JSON.parse(xhr.responseText || '{}');
      } catch {
        reject(new Error('Upload failed'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300 && result.success) {
        onProgress?.({ percent: 100, loaded: file.size, total: file.size, stage: 'save' });
        resolve(result.data);
        return;
      }
      reject(new Error(result.error || `Upload failed (${xhr.status})`));
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Upload failed. Check your connection and try again.'))
    );
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.addEventListener('timeout', () =>
      reject(new Error('Upload timed out. Try a smaller clip, or keep this tab open and retry.'))
    );

    xhr.open('POST', url);
    xhr.send(form);
  });
}

class CreatorVideoService {
  async list(includeHidden = false) {
    const params = includeHidden ? { all: '1' } : {};
    return apiClient.get('/api/creator-videos', params);
  }

  async create(payload) {
    return apiClient.post('/api/creator-videos', payload);
  }

  async update(id, payload) {
    return apiClient.put(`/api/creator-videos?id=${encodeURIComponent(id)}`, payload);
  }

  async remove(id) {
    return apiClient.delete(`/api/creator-videos?id=${encodeURIComponent(id)}`);
  }

  async uploadFile(file, onProgress) {
    if (useDirectBlob) {
      onProgress?.({ percent: 5, loaded: 0, total: file.size, indeterminate: true });
      const blob = await upload(`creators/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: `${apiClient.baseUrl}/api/creator-videos?resource=blob`,
      });
      onProgress?.({ percent: 100, loaded: file.size, total: file.size });
      return { url: blob.url, filename: blob.pathname };
    }

    return uploadWithXhr(
      `${apiClient.baseUrl}/api/creator-videos?resource=upload`,
      file,
      onProgress
    );
  }
}

const creatorVideoService = new CreatorVideoService();
export default creatorVideoService;
