/**
 * DAS Home Page
 * Main landing page for Data Analysis Service
 */

import React, { useState } from 'react';
import { UploadPanel } from '../components/UploadPanel';
import { DatasetTable } from '../components/DatasetTable';
import { useDatasets } from '../hooks/useDatasets';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, BarChart3 } from 'lucide-react';

export const DasHome = () => {
  const [page, setPage] = useState(0);
  const { datasets, loading, error, totalPages, refetch } = useDatasets(page, 10);

  const handleUploadSuccess = (datasetIds) => {
    // Refresh datasets after successful upload
    console.log('Datasets created:', datasetIds);
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Data Analysis Service</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Upload, explore, clean, and analyze your data with powerful tools
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <UploadPanel onUploadSuccess={handleUploadSuccess} />
      </section>

      {/* Datasets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">My Datasets</h2>
          {!loading && datasets.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading datasets...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive font-medium">Error loading datasets</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <DatasetTable 
              datasets={datasets} 
              onRefresh={refetch}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default DasHome;

