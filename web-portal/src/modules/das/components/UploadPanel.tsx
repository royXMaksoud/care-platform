/**
 * Upload Panel Component
 * Handles file upload with drag-and-drop support
 */

import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { filesApi } from '../api/files';
import { datasetsApi } from '../api/datasets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadPanelProps {
  onUploadSuccess?: (datasetIds: string[]) => void;
}

interface UploadedFileInfo {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
  fileId?: string;
  datasetId?: string;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
    });

    if (validFiles.length > 0) {
      addFiles(validFiles);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const fileInfos: UploadedFileInfo[] = newFiles.map(file => ({
      file,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...fileInfos]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const uploadAndRegister = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const datasetIds: string[] = [];

    try {
      // Get pending files
      const pendingFiles = files.filter(f => f.status === 'pending');
      if (pendingFiles.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Extract File objects
      const fileObjects = pendingFiles.map(f => f.file);

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'uploading' } 
          : f
      ));

      // Upload files
      const uploadResponse = await filesApi.upload(fileObjects);
      
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('Upload failed');
      }

      // Register datasets
      for (let i = 0; i < uploadResponse.data.length; i++) {
        const uploadedFile = uploadResponse.data[i];
        const originalFile = fileObjects[i];
        
        try {
          // Extract name without extension
          const datasetName = originalFile.name.replace(/\.(csv|xlsx|xls)$/i, '');
          
          // Register dataset
          const registerResponse = await datasetsApi.registerFromFile(
            uploadedFile.fileId,
            datasetName
          );

          if (registerResponse.success && registerResponse.data) {
            datasetIds.push(registerResponse.data.datasetId);
            
            // Update file status
            setFiles(prev => prev.map(f => 
              f.file === originalFile
                ? {
                    ...f,
                    status: 'success',
                    fileId: uploadedFile.fileId,
                    datasetId: registerResponse.data.datasetId,
                    message: 'Dataset registered successfully'
                  }
                : f
            ));
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          setFiles(prev => prev.map(f => 
            f.file === originalFile
              ? {
                  ...f,
                  status: 'error',
                  message: error.message || 'Registration failed'
                }
              : f
          ));
        }
      }

      // Notify parent
      if (onUploadSuccess && datasetIds.length > 0) {
        onUploadSuccess(datasetIds);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading'
          ? {
              ...f,
              status: 'error',
              message: error.message || 'Upload failed'
            }
          : f
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: UploadedFileInfo['status']) => {
    switch (status) {
      case 'pending':
        return <FileSpreadsheet className="h-5 w-5 text-gray-400" />;
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Card className="p-6">
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2 text-foreground">
          Drag & drop files here
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse
        </p>
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          Supported formats: CSV, Excel (XLSX, XLS)
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                      {file.message && ` • ${file.message}`}
                    </p>
                  </div>
                </div>
                {file.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={uploadAndRegister}
              disabled={isProcessing || files.every(f => f.status !== 'pending')}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Register'
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UploadPanel;
