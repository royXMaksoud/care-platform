/**
 * Quality Builder Component
 * Build and configure data quality validation rules
 */

import React, { useState } from 'react';
import { Plus, Trash2, Play, Download, Save } from 'lucide-react';
import { DataQualityRule, DataQualityReport } from '../types';
import { useValidation } from '../hooks/useValidation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QualityBuilderProps {
  datasetId: string;
  columns: string[];
}

export const QualityBuilder: React.FC<QualityBuilderProps> = ({ datasetId, columns }) => {
  const [rules, setRules] = useState<DataQualityRule[]>([]);
  const { report, loading, validate } = useValidation();

  const addRule = () => {
    setRules([
      ...rules,
      {
        column: columns[0] || '',
        required: false,
      }
    ]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof DataQualityRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleValidate = async () => {
    try {
      await validate(datasetId, rules, 100);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const saveTemplate = () => {
    const template = {
      name: `Template_${new Date().toISOString()}`,
      rules
    };
    localStorage.setItem('das_quality_template', JSON.stringify(template));
    alert('Template saved to local storage');
  };

  const loadTemplate = () => {
    const saved = localStorage.getItem('das_quality_template');
    if (saved) {
      const template = JSON.parse(saved);
      setRules(template.rules);
      alert('Template loaded');
    }
  };

  const downloadViolations = () => {
    if (report?.violationsCsvPath) {
      window.open(`/das/api${report.violationsCsvPath}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Rules Builder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Validation Rules</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadTemplate}>
              Load Template
            </Button>
            <Button variant="outline" size="sm" onClick={saveTemplate} disabled={rules.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No validation rules yet</p>
            <Button onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="grid grid-cols-12 gap-4">
                  {/* Column */}
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Column</label>
                    <select
                      value={rule.column}
                      onChange={(e) => updateRule(index, 'column', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Required */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">Required</label>
                    <input
                      type="checkbox"
                      checked={rule.required || false}
                      onChange={(e) => updateRule(index, 'required', e.target.checked)}
                      className="mt-2"
                    />
                  </div>

                  {/* Expected Type */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Expected Type</label>
                    <select
                      value={rule.expectedType || ''}
                      onChange={(e) => updateRule(index, 'expectedType', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value="">Any</option>
                      <option value="STRING">STRING</option>
                      <option value="INTEGER">INTEGER</option>
                      <option value="DECIMAL">DECIMAL</option>
                      <option value="BOOLEAN">BOOLEAN</option>
                      <option value="DATE">DATE</option>
                      <option value="DATETIME">DATETIME</option>
                    </select>
                  </div>

                  {/* Min/Max */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Min</label>
                    <input
                      type="number"
                      value={rule.min ?? ''}
                      onChange={(e) => updateRule(index, 'min', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Min value"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Max</label>
                    <input
                      type="number"
                      value={rule.max ?? ''}
                      onChange={(e) => updateRule(index, 'max', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Max value"
                    />
                  </div>

                  {/* Regex */}
                  <div className="col-span-11">
                    <label className="block text-xs font-medium mb-1">Regex Pattern</label>
                    <input
                      type="text"
                      value={rule.regex || ''}
                      onChange={(e) => updateRule(index, 'regex', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="e.g., ^[A-Za-z0-9]+@.*$"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Validate Button */}
        {rules.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleValidate} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Validating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Validate Dataset
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Validation Report */}
      {report && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Validation Report</h3>
            {report.violationsCsvPath && (
              <Button variant="outline" size="sm" onClick={downloadViolations}>
                <Download className="h-4 w-4 mr-2" />
                Download Violations CSV
              </Button>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Rows</div>
              <div className="text-2xl font-bold text-blue-700">{report.totalRows.toLocaleString()}</div>
            </div>
            <div className={`rounded-lg p-4 ${report.totalViolations > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="text-sm text-gray-600">Total Violations</div>
              <div className={`text-2xl font-bold ${report.totalViolations > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {report.totalViolations.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Rules Checked</div>
              <div className="text-2xl font-bold text-purple-700">{report.ruleResults.length}</div>
            </div>
          </div>

          {/* Rule Results */}
          <div className="space-y-3">
            <h4 className="font-medium">Rule Results</h4>
            {report.ruleResults.map((result, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      Column: <span className="text-primary">{result.rule.column}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {result.rule.required && <div>• Required field</div>}
                      {result.rule.expectedType && <div>• Type: {result.rule.expectedType}</div>}
                      {result.rule.min !== undefined && <div>• Min: {result.rule.min}</div>}
                      {result.rule.max !== undefined && <div>• Max: {result.rule.max}</div>}
                      {result.rule.regex && <div>• Pattern: {result.rule.regex}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${result.violationCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {result.violationCount}
                    </div>
                    <div className="text-xs text-gray-500">violations</div>
                    {result.sampleRowIndexes.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Rows: {result.sampleRowIndexes.slice(0, 5).join(', ')}
                        {result.sampleRowIndexes.length > 5 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QualityBuilder;
