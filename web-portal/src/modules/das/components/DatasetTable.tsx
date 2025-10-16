/**
 * Dataset Table Component
 * Displays list of datasets in a table format with actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, Trash2, Database } from 'lucide-react';
import { Dataset } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { datasetsApi } from '../api/datasets';

interface DatasetTableProps {
  datasets: Dataset[];
  onSelectDataset?: (dataset: Dataset) => void;
  onRefresh?: () => void;
}

export const DatasetTable: React.FC<DatasetTableProps> = ({ 
  datasets, 
  onSelectDataset,
  onRefresh 
}) => {
  const navigate = useNavigate();

  const handleView = (dataset: Dataset) => {
    navigate(`/das/datasets/${dataset.datasetId}`);
    if (onSelectDataset) {
      onSelectDataset(dataset);
    }
  };

  const handleDownload = async (dataset: Dataset) => {
    try {
      const blob = await datasetsApi.download(dataset.datasetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.name || 'dataset'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download dataset');
    }
  };

  const handleDelete = async (dataset: Dataset) => {
    if (!confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      return;
    }

    try {
      await datasetsApi.delete(dataset.datasetId);
      alert('Dataset deleted successfully');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete dataset');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (datasets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Datasets Yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload files above to create your first dataset
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rows
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Columns
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {datasets.map((dataset) => (
              <tr 
                key={dataset.datasetId}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {dataset.name}
                      </div>
                      {dataset.description && (
                        <div className="text-xs text-muted-foreground">
                          {dataset.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {dataset.rowCount?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {dataset.columnCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(dataset.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(dataset)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(dataset)}
                      title="Download CSV"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dataset)}
                      title="Delete Dataset"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DatasetTable;
