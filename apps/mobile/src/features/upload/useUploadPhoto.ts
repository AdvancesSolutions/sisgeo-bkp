import { useMutation } from '@tanstack/react-query';
import { uploadPhoto, type PhotoUploadMetadata } from '../../services/uploadService';

export function useUploadPhoto() {
  return useMutation({
    mutationFn: ({ uri, metadata }: { uri: string; metadata: PhotoUploadMetadata }) =>
      uploadPhoto(uri, metadata),
  });
}
