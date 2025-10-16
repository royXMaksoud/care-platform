/**
 * Dataset Details Page
 * Detailed view of a single dataset with profiling and analysis using Tabs
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dataset } from '../types';
import { datasetsApi } from '../api/datasets';
import { DatasetHeader } from '../components/DatasetHeader';
import { ProfileTable } from '../components/ProfileTable';
import { ChartsPanel } from '../components/ChartsPanel';
import { QualityBuilder } from '../components/QualityBuilder';
import { JoinBuilder } from '../components/JoinBuilder';
import { PipelineRunner } from '../components/PipelineRunner';
import { JobCenter } from '../components/JobCenter';
import { ColumnDrawer } from '../components/ColumnDrawer';
import { useDatasetProfile } from '../hooks/useDatasetProfile';
import { useColumnSummary } from '../hooks/useColumnSummary';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  ShieldCheck, 
  GitMerge, 
  Workflow, 
  Clock, 
  Database 
} from 'lucide-react';

type TabType = 'profile' | 'charts' | 'quality' | 'join' | 'pipelines' | 'jobs';

const TABS = [
  { id: 'profile', label: 'Profile', icon: Database },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'quality', label: 'Quality', icon: ShieldCheck },
  { id: 'join', label: 'Join', icon: GitMerge },
  { id: 'pipelines', label: 'Pipelines', icon: Workflow },
  { id: 'jobs', label: 'Jobs', icon: Clock },
] as const;

export const DatasetDetails: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { profile, loading: profileLoading } = useDatasetProfile(datasetId || null);
  const { summary, chartData } = useColumnSummary(
    datasetId || null, 
    selectedColumn
  );

  useEffect(() => {
    if (datasetId) {
      fetchDataset();
    }
  }, [datasetId]);

  const fetchDataset = async () => {
    if (!datasetId) return;
    
    try {
      setLoading(true);
      const response = await datasetsApi.getById(datasetId);
      setDataset(response.data);
    } catch (error) {
      console.error('Failed to fetch dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnClick = (columnName: string) => {
    setSelectedColumn(columnName);
    setDrawerOpen(true);
  };

  const handleDownload = async () => {
    if (!datasetId) return;
    
    try {
      const blob = await datasetsApi.download(datasetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset?.name || 'dataset'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download dataset:', error);
      alert('Failed to download dataset');
    }
  };

  const handleDelete = async () => {
    if (!datasetId || !dataset) return;
    
    if (!confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      return;
    }

    try {
      await datasetsApi.delete(datasetId);
      alert('Dataset deleted successfully');
      navigate('/das');
    } catch (error) {
      console.error('Failed to delete dataset:', error);
      alert('Failed to delete dataset');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <Card className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Dataset Not Found</h2>
        <p className="text-gray-500 mb-4">The requested dataset could not be loaded</p>
        <button
          onClick={() => navigate('/das')}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Back to Datasets
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DatasetHeader 
        dataset={dataset}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />

      {/* Tabs */}
      <Card>
        <div className="border-b">
          <nav className="flex space-x-1 px-2" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${isActive 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <>
              {profileLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading profile...</p>
                </div>
              )}
              {profile && (
                <ProfileTable 
                  profile={profile}
                  onColumnClick={handleColumnClick}
                />
              )}
            </>
          )}

          {activeTab === 'charts' && profile && (
            <ChartsPanel 
              datasetId={datasetId!}
              columns={profile.columns}
            />
          )}

          {activeTab === 'quality' && (
            <QualityBuilder 
              datasetId={datasetId!}
              columns={profile?.columns.map(c => c.columnName) || []}
            />
          )}

          {activeTab === 'join' && (
            <JoinBuilder 
              leftDatasetId={datasetId!}
              leftColumns={profile?.columns.map(c => c.columnName) || []}
            />
          )}

          {activeTab === 'pipelines' && (
            <PipelineRunner datasetId={datasetId!} />
          )}

          {activeTab === 'jobs' && (
            <JobCenter />
          )}
        </div>
      </Card>

      {/* Column Drawer */}
      <ColumnDrawer
        isOpen={drawerOpen}
        columnName={selectedColumn || ''}
        datasetId={datasetId!}
        summary={summary || undefined}
        chartData={chartData || undefined}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default DatasetDetails;

