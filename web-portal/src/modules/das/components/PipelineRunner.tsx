/**
 * Pipeline Runner Component
 * Build and execute data pipelines with templates
 */

import React, { useState, useEffect } from 'react';
import { Play, FileJson, Rocket, CheckCircle } from 'lucide-react';
import { Pipeline, PipelineTemplate } from '../types';
import { usePipelines } from '../hooks/usePipelines';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PipelineRunnerProps {
  datasetId: string;
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({ datasetId }) => {
  const { templates, result, loading, runPipeline } = usePipelines();
  const [activeView, setActiveView] = useState<'templates' | 'custom'>('templates');
  const [customJson, setCustomJson] = useState('');
  const [isAsync, setIsAsync] = useState(false);

  const handleRunTemplate = async (template: PipelineTemplate) => {
    // Inject current datasetId into template
    const pipeline = JSON.parse(JSON.stringify(template.pipeline));
    
    // Find read_dataset nodes and update datasetId
    pipeline.nodes = pipeline.nodes.map((node: any) => {
      if (node.op === 'read_dataset') {
        return {
          ...node,
          params: { ...node.params, datasetId }
        };
      }
      return node;
    });

    try {
      await runPipeline(pipeline, isAsync);
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      alert('Pipeline execution failed');
    }
  };

  const handleRunCustom = async () => {
    try {
      const pipeline: Pipeline = JSON.parse(customJson);
      await runPipeline(pipeline, isAsync);
    } catch (error: any) {
      alert(`Failed to parse or run pipeline: ${error.message}`);
    }
  };

  const loadExampleJson = () => {
    const example: Pipeline = {
      name: 'Example Pipeline',
      nodes: [
        {
          id: 'n1',
          op: 'read_dataset',
          params: { datasetId }
        },
        {
          id: 'n2',
          op: 'profile',
          params: {}
        }
      ],
      edges: [
        { from: 'n1', to: 'n2' }
      ]
    };
    setCustomJson(JSON.stringify(example, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveView('templates')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeView === 'templates' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <Rocket className="h-4 w-4 inline mr-2" />
          Templates
        </button>
        <button
          onClick={() => setActiveView('custom')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeView === 'custom' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <FileJson className="h-4 w-4 inline mr-2" />
          Custom JSON
        </button>
      </div>

      {/* Async Toggle */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAsync}
            onChange={(e) => setIsAsync(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Run Asynchronously (for large operations)</span>
        </label>
      </Card>

      {/* Templates View */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.length === 0 ? (
            <Card className="col-span-2 p-12 text-center">
              <p className="text-gray-500">No pipeline templates available</p>
            </Card>
          ) : (
            templates.map(template => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-semibold mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {template.pipeline.nodes.length} operations
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRunTemplate(template)}
                    disabled={loading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Custom JSON View */}
      {activeView === 'custom' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Custom Pipeline JSON</h3>
            <Button variant="outline" size="sm" onClick={loadExampleJson}>
              Load Example
            </Button>
          </div>
          <textarea
            value={customJson}
            onChange={(e) => setCustomJson(e.target.value)}
            className="w-full h-96 px-3 py-2 font-mono text-sm border rounded-md"
            placeholder="Paste your pipeline JSON here..."
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleRunCustom} disabled={loading || !customJson}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Pipeline
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-2">Pipeline Executed Successfully</h3>
              <div className="text-sm text-green-700 space-y-1">
                {result.generatedDatasetIds.length > 0 && (
                  <p>Generated {result.generatedDatasetIds.length} new dataset(s)</p>
                )}
                {result.artifacts.length > 0 && (
                  <p>Created {result.artifacts.length} artifact(s)</p>
                )}
              </div>
              {result.generatedDatasetIds.length > 0 && (
                <div className="mt-3">
                  {result.generatedDatasetIds.map((id, index) => (
                    <Button
                      key={id}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/das/datasets/${id}`, '_blank')}
                      className="mr-2 mt-2"
                    >
                      View Dataset {index + 1}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PipelineRunner;
