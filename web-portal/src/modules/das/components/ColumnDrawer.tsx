/**
 * Column Drawer Component
 * Side drawer for detailed column analysis with charts
 */

import React, { useEffect } from 'react';
import { X, Download, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ColumnSummary, ChartData } from '../types';
import { useColumnSummary } from '../hooks/useColumnSummary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ColumnDrawerProps {
  isOpen: boolean;
  columnName: string;
  datasetId: string;
  summary?: ColumnSummary;
  chartData?: ChartData;
  onClose: () => void;
}

export const ColumnDrawer: React.FC<ColumnDrawerProps> = ({ 
  isOpen, 
  columnName, 
  datasetId,
  onClose 
}) => {
  const { summary, chartData, loading } = useColumnSummary(
    isOpen ? datasetId : null,
    isOpen ? columnName : null
  );

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadChartData = () => {
    const data = { summary, chartData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${columnName}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold">{columnName}</h2>
                <p className="text-sm text-gray-500">Column Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadChartData}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading column analysis...</p>
            </div>
          )}

          {!loading && summary && (
            <>
              {/* Summary Statistics */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5" />
                  Summary Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Count</div>
                    <div className="text-2xl font-bold">{summary.count?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Null Values</div>
                    <div className="text-2xl font-bold text-red-600">
                      {summary.nulls?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Non-Null Values</div>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.nonNulls?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Unique Values</div>
                    <div className="text-2xl font-bold">
                      {summary.uniques?.toLocaleString() || '-'}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Numeric Statistics */}
              {(summary.mean !== undefined || summary.min !== undefined) && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Numeric Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {summary.min !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Minimum</div>
                        <div className="text-xl font-bold">{summary.min}</div>
                      </div>
                    )}
                    {summary.max !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Maximum</div>
                        <div className="text-xl font-bold">{summary.max}</div>
                      </div>
                    )}
                    {summary.mean !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Mean</div>
                        <div className="text-xl font-bold">{summary.mean.toFixed(2)}</div>
                      </div>
                    )}
                    {summary.std !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Std Dev</div>
                        <div className="text-xl font-bold">{summary.std.toFixed(2)}</div>
                      </div>
                    )}
                    {summary.q25 !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Q1 (25%)</div>
                        <div className="text-xl font-bold">{summary.q25.toFixed(2)}</div>
                      </div>
                    )}
                    {summary.q50 !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Median (50%)</div>
                        <div className="text-xl font-bold">{summary.q50.toFixed(2)}</div>
                      </div>
                    )}
                    {summary.q75 !== undefined && (
                      <div>
                        <div className="text-sm text-gray-600">Q3 (75%)</div>
                        <div className="text-xl font-bold">{summary.q75.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Top Values */}
              {summary.topValues && summary.topValues.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Top Values</h3>
                  <div className="space-y-2">
                    {summary.topValues.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.value}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ 
                                width: `${(item.count / (summary.count || 1)) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-16 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {!loading && chartData && (
            <>
              {/* Histogram */}
              {chartData.histogram && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Distribution (Histogram)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.histogram.bins}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="binStart" 
                        tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="frequency" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Categories */}
              {chartData.categories && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Top Categories</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.categories.entries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Timeseries */}
              {chartData.timeseries && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Time Series</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.timeseries.points}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ColumnDrawer;
