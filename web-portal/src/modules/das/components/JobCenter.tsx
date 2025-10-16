/**
 * Job Center Component
 * Monitor and manage asynchronous jobs with real-time SSE updates
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Job } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JobCenterProps {
  jobs?: Job[];
  onJobSelect?: (job: Job) => void;
}

export const JobCenter: React.FC<JobCenterProps> = ({ jobs = [], onJobSelect }) => {
  const [localJobs, setLocalJobs] = useState<Job[]>(jobs);

  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'RUNNING':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'SUCCEEDED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-700';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-700';
      case 'SUCCEEDED':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (localJobs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Jobs Running</h3>
        <p className="text-sm text-gray-500">
          Asynchronous jobs will appear here when you run large operations
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Enable "Run Asynchronously" in Pipelines tab for long-running tasks
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Active Jobs ({localJobs.length})</h3>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {localJobs.map((job) => (
        <Card 
          key={job.jobId} 
          className="p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onJobSelect?.(job)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(job.status)}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-medium">{job.type}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  Job ID: {job.jobId}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {job.status === 'RUNNING' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{job.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${job.progress || 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">Started</div>
              <div className="font-medium">{formatDate(job.startTime)}</div>
            </div>
            {job.endTime && (
              <div>
                <div className="text-xs text-gray-500">Finished</div>
                <div className="font-medium">{formatDate(job.endTime)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-medium">{calculateDuration(job.startTime, job.endTime)}</div>
            </div>
          </div>

          {/* Error Message */}
          {job.errorMessage && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <div className="font-medium mb-1">Error:</div>
              <div>{job.errorMessage}</div>
            </div>
          )}

          {/* Result */}
          {job.result && (
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Result:</div>
              <div className="text-sm bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                <pre className="text-xs">
                  {JSON.stringify(job.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default JobCenter;
