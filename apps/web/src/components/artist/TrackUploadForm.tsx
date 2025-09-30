'use client';

import React, { useState, useRef } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileAudio, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { storage, databases } from '@humane/lib/appwrite'; // Import Appwrite storage and databases
import { ID, Permission, Role } from 'appwrite'; // Import Appwrite ID, Permission, Role
import { Track } from '@/types'; // Import Track type

const TrackUploadForm: React.FC = () => {
  const { user, appwriteAccount, loading: authLoading } = useAuthContext();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState(''); // For now, assume artistId is user.id
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const APPWRITE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  const APPWRITE_TRACKS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TRACKS_COLLECTION_ID!;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.type.startsWith('audio/')) {
        toast.error('Please select an audio file (e.g., WAV, FLAC, MP3).');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);
      // Optionally set title from file name
      setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
    }
  };

  const handleUpload = async () => {
    if (!appwriteAccount || authLoading || !user) {
      toast.error('You must be logged in to upload tracks.');
      return;
    }
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a track title.');
      return;
    }
    if (!APPWRITE_BUCKET_ID || !APPWRITE_DATABASE_ID || !APPWRITE_TRACKS_COLLECTION_ID) {
      toast.error('Appwrite environment variables are not fully configured.');
      console.error('Missing Appwrite env vars.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // 1. Upload file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(), // Generate a unique file ID
        file,
        [
          Permission.read(Role.any()), // Public read for audio streaming
          Permission.write(Role.user(appwriteAccount.$id)),
        ]
      );

      // 2. Create a Track document in Appwrite Database
      const newTrack: Omit<Track, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        artistId: user.id, // For now, assume the uploader is the artist
        title: title.trim(),
        duration: 0, // Will be updated by transcoding function
        accessMode: 'public', // Default access mode
        collaborators: [],
        metadata: { tags: [] },
        audioFile: {
          original: uploadedFile.$id, // Store the Appwrite file ID
          hlsProcessingStatus: 'pending', // Initial status
        },
        isExplicit: false,
        isPublished: false,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRACKS_COLLECTION_ID,
        ID.unique(), // Generate a unique document ID for the track
        newTrack as any, // Cast to any for now due to partial type match with Models.Document
        [
          Permission.read(Role.any()), // Public read for track metadata
          Permission.write(Role.user(appwriteAccount.$id)),
        ]
      );

      setUploadProgress(100); 
      setUploadSuccess(true);
      toast.success('Track uploaded and registered successfully! It will be processed shortly.');
      
      // Reset form
      setFile(null);
      setTitle('');
      setArtistId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(`Upload failed: ${error.message}`);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
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
          <Label htmlFor="track-title">Track Title</Label>
          <Input
            id="track-title"
            type="text"
            placeholder="My Awesome Track"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading || authLoading}
            required
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="audio-file">Audio File</Label>
          <Input
            id="audio-file"
            type="file"
            accept="audio/wav,audio/flac,audio/mpeg,audio/aac" // Common audio formats
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isUploading || authLoading}
            required
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
          disabled={!file || !title.trim() || isUploading || authLoading}
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