/**
 * Join Builder Component
 * Build and configure dataset joins (pandas-like merge)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitMerge, Play, Loader2 } from 'lucide-react';
import { JoinRequest, Dataset } from '../types';
import { useJoin } from '../hooks/useJoin';
import { useDatasets } from '../hooks/useDatasets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface JoinBuilderProps {
  leftDatasetId: string;
  leftColumns: string[];
}

export const JoinBuilder: React.FC<JoinBuilderProps> = ({ leftDatasetId, leftColumns }) => {
  const navigate = useNavigate();
  const { datasets } = useDatasets(0, 100); // Get all datasets
  const { result, loading, join } = useJoin();

  const [rightDatasetId, setRightDatasetId] = useState<string>('');
  const [rightColumns, setRightColumns] = useState<string[]>([]);
  const [leftOn, setLeftOn] = useState<string[]>([]);
  const [rightOn, setRightOn] = useState<string[]>([]);
  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'FULL'>('INNER');
  const [leftSuffix, setLeftSuffix] = useState('_left');
  const [rightSuffix, setRightSuffix] = useState('_right');

  // Filter out current dataset
  const availableDatasets = datasets.filter(d => d.datasetId !== leftDatasetId);

  useEffect(() => {
    if (rightDatasetId) {
      // Fetch right dataset columns
      const rightDataset = datasets.find(d => d.datasetId === rightDatasetId);
      if (rightDataset?.header) {
        setRightColumns(rightDataset.header);
      }
    }
  }, [rightDatasetId, datasets]);

  const handleAddLeftColumn = () => {
    if (leftColumns.length > 0 && !leftOn.includes(leftColumns[0])) {
      setLeftOn([...leftOn, leftColumns[0]]);
      setRightOn([...rightOn, rightColumns[0] || '']);
    }
  };

  const handleRemoveJoinKey = (index: number) => {
    setLeftOn(leftOn.filter((_, i) => i !== index));
    setRightOn(rightOn.filter((_, i) => i !== index));
  };

  const handleRunJoin = async () => {
    if (!rightDatasetId || leftOn.length === 0 || rightOn.length === 0) {
      alert('Please configure join keys');
      return;
    }

    const request: JoinRequest = {
      leftDatasetId,
      rightDatasetId,
      leftOn,
      rightOn,
      how: joinType,
      suffixes: [leftSuffix, rightSuffix]
    };

    try {
      const joinResult = await join(request);
      alert(`Join successful! Created new dataset with ${joinResult.rows} rows`);
      navigate(`/das/datasets/${joinResult.datasetId}`);
    } catch (error: any) {
      alert(`Join failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Configure Join
        </h3>

        {/* Select Right Dataset */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Right Dataset</label>
            <select
              value={rightDatasetId}
              onChange={(e) => setRightDatasetId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a dataset...</option>
              {availableDatasets.map(dataset => (
                <option key={dataset.datasetId} value={dataset.datasetId}>
                  {dataset.name} ({dataset.rowCount} rows, {dataset.columnCount} cols)
                </option>
              ))}
            </select>
          </div>

          {/* Join Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Join Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['INNER', 'LEFT', 'RIGHT', 'FULL'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setJoinType(type)}
                  className={`
                    px-4 py-2 rounded-md font-medium text-sm transition-colors
                    ${joinType === type 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Join Keys */}
          {rightDatasetId && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Join Keys</label>
                  <Button size="sm" onClick={handleAddLeftColumn}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                </div>
                
                {leftOn.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No join keys configured</p>
                    <Button size="sm" onClick={handleAddLeftColumn} className="mt-2">
                      Add First Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leftOn.map((left, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded">
                        <div className="col-span-5">
                          <select
                            value={left}
                            onChange={(e) => {
                              const newLeftOn = [...leftOn];
                              newLeftOn[index] = e.target.value;
                              setLeftOn(newLeftOn);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            {leftColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 text-center text-sm font-medium text-gray-500">
                          =
                        </div>
                        <div className="col-span-5">
                          <select
                            value={rightOn[index] || ''}
                            onChange={(e) => {
                              const newRightOn = [...rightOn];
                              newRightOn[index] = e.target.value;
                              setRightOn(newRightOn);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            {rightColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveJoinKey(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suffixes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Left Suffix</label>
                  <input
                    type="text"
                    value={leftSuffix}
                    onChange={(e) => setLeftSuffix(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="_left"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Right Suffix</label>
                  <input
                    type="text"
                    value={rightSuffix}
                    onChange={(e) => setRightSuffix(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="_right"
                  />
                </div>
              </div>

              {/* Run Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleRunJoin} 
                  disabled={loading || leftOn.length === 0}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <GitMerge className="h-5 w-5 mr-2" />
                      Run Join
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Result Preview */}
      {result && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold mb-2 text-green-800">Join Successful!</h3>
          <div className="text-sm text-green-700">
            <p>Created new dataset with {result.rows.toLocaleString()} rows and {result.columns} columns</p>
            <p className="mt-2">Dataset ID: <code className="bg-white px-2 py-1 rounded">{result.datasetId}</code></p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default JoinBuilder;
