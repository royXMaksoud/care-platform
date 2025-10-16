/**
 * Dataset Header Component
 * Displays dataset metadata and actions
 */

import React from 'react';
import { Download, RefreshCw, Trash2, ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dataset } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DatasetHeaderProps {
  dataset: Dataset;
  onDownload?: () => void;
  onDelete?: () => void;
  onReProfile?: () => void;
}

export const DatasetHeader: React.FC<DatasetHeaderProps> = ({ 
  dataset, 
  onDownload, 
  onDelete,
  onReProfile 
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/das')}
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{dataset.name}</h1>
            </div>
            {dataset.description && (
              <p className="text-gray-600">{dataset.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Created: {formatDate(dataset.createdAt)}
              {dataset.updatedAt && ` • Updated: ${formatDate(dataset.updatedAt)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReProfile}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-Profile
            </Button>
          )}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Rows</div>
          <div className="text-2xl font-bold text-blue-700">
            {dataset.rowCount?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Columns</div>
          <div className="text-2xl font-bold text-green-700">
            {dataset.columnCount || 0}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">File ID</div>
          <div className="text-xs font-mono text-purple-700 truncate">
            {dataset.fileId}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DatasetHeader;
