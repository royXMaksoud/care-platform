/**
 * Profile Table Component
 * Displays dataset profiling information with search and filtering
 */

import React, { useState, useMemo } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { DatasetProfile, ColumnProfile } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';

interface ProfileTableProps {
  profile: DatasetProfile;
  onColumnClick?: (columnName: string) => void;
}

const TYPE_COLORS = {
  STRING: 'bg-blue-100 text-blue-800',
  INTEGER: 'bg-green-100 text-green-800',
  DECIMAL: 'bg-purple-100 text-purple-800',
  BOOLEAN: 'bg-yellow-100 text-yellow-800',
  DATE: 'bg-pink-100 text-pink-800',
  DATETIME: 'bg-orange-100 text-orange-800',
};

export const ProfileTable: React.FC<ProfileTableProps> = ({ profile, onColumnClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = useMemo(() => {
    if (!searchTerm) return profile.columns;
    
    return profile.columns.filter(col =>
      col.columnName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profile.columns, searchTerm]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b bg-muted/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Showing {filteredColumns.length} of {profile.columns.length} columns
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Column Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Confidence
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Nulls
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Valid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Invalid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Unique
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Examples
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredColumns.map((column) => (
              <tr key={column.columnName} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-foreground">{column.columnName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      TYPE_COLORS[column.dominantType] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {column.dominantType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`font-medium ${getConfidenceColor(column.confidence)}`}>
                    {(column.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-muted-foreground">
                  {column.nullCount?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-muted-foreground">
                  {column.validCount?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={column.invalidCount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {column.invalidCount?.toLocaleString() || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-muted-foreground">
                  {column.uniqueCount?.toLocaleString() || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                  {column.examples?.slice(0, 3).join(', ') || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {onColumnClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onColumnClick(column.columnName)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Explore
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredColumns.length === 0 && (
        <div className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No columns found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search term
          </p>
        </div>
      )}
    </Card>
  );
};

export default ProfileTable;
