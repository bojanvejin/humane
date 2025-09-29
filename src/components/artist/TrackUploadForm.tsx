'use client';

import React, { useState, useRef } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileAudio, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { app } from '@/lib/firebase'; // Import the Firebase app instance

const TrackUploadForm: React.FC = () => {
  const { firebaseUser, loading: authLoading } = useAuthContext();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Basic validation for audio files
      if (!selectedFile.type.startsWith('audio/')) {
        toast.error('Please select an audio file (e.g., WAV, FLAC, MP3).');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!firebaseUser || authLoading) {
      toast.error('You must be logged in to upload tracks.');
      return;
    }
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const storage = getStorage(app);
    // Store files in 'masters/{userId}/{fileName}'
    const storageRef = ref(storage, `masters/${firebaseUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        setUploadError(`Upload failed: ${error.message}`);
        toast.error(`Upload failed: ${error.message}`);
        setIsUploading(false);
      },
      () => {
        // Upload completed successfully
        setUploadSuccess(true);
        toast.success('Track uploaded successfully! It will be processed shortly.');
        setIsUploading(false);
        setFile(null); // Clear the selected file
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input
        }
      }
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Upload New Track</CardTitle>
        <CardDescription>
          Upload your WAV or FLAC files. We'll handle the transcoding for streaming.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="audio-file">Audio File</Label>
          <Input
            id="audio-file"
            type="file"
            accept="audio/wav,audio/flac,audio/mpeg,audio/aac" // Common audio formats
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading || authLoading}
          />
          {file && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
              <FileAudio className="h-4 w-4" /> {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">{uploadProgress.toFixed(0)}%</p>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <XCircle className="h-4 w-4" /> {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" /> Upload complete!
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading || authLoading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload Track
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrackUploadForm;