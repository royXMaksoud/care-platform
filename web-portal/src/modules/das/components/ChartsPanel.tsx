/**
 * Charts Panel Component
 * Renders charts for data visualization based on column type
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Copy, Download } from 'lucide-react';
import { ChartData, ColumnProfile } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { columnsApi } from '../api/columns';

interface ChartsPanelProps {
  datasetId: string;
  columns: ColumnProfile[];
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ datasetId, columns }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (columns.length > 0 && !selectedColumn) {
      setSelectedColumn(columns[0].columnName);
    }
  }, [columns]);

  useEffect(() => {
    if (selectedColumn && datasetId) {
      fetchChartData();
    }
  }, [selectedColumn, datasetId]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chartsResponse, summaryResponse] = await Promise.all([
        columnsApi.getCharts(datasetId, selectedColumn),
        columnsApi.getSummary(datasetId, selectedColumn)
      ]);

      setChartData(chartsResponse.data);
      setSummary(summaryResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  };

  const selectedColumnProfile = columns.find(c => c.columnName === selectedColumn);

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
    alert('Chart data copied to clipboard');
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedColumn}_chart_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Column Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Select Column</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full max-w-md px-3 py-2 border rounded-md"
            >
              {columns.map(col => (
                <option key={col.columnName} value={col.columnName}>
                  {col.columnName} ({col.dominantType})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyJSON} disabled={!chartData}>
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJSON} disabled={!chartData}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading chart data...</p>
        </Card>
      )}

      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && chartData && (
        <>
          {/* Summary Stats */}
          {summary && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Summary Statistics</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Count</div>
                  <div className="text-xl font-bold">{summary.count?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Nulls</div>
                  <div className="text-xl font-bold">{summary.nulls?.toLocaleString() || 0}</div>
                </div>
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
                {summary.min !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Min</div>
                    <div className="text-xl font-bold">{summary.min}</div>
                  </div>
                )}
                {summary.max !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Max</div>
                    <div className="text-xl font-bold">{summary.max}</div>
                  </div>
                )}
                {summary.uniques !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Unique</div>
                    <div className="text-xl font-bold">{summary.uniques?.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Histogram for Numeric */}
          {chartData.histogram && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Distribution (Histogram)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.histogram.bins}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="binStart" 
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Bar Chart for Categories */}
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

          {/* Line Chart for Timeseries */}
          {chartData.timeseries && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Time Series</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.timeseries.points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ChartsPanel;
