import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Database,
  File,
  Layers,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/AppContext';
import { collectionApi } from '@/lib/mockApi';

interface StatsData {
  documentCount: number;
  avgDocumentSize: number;
  totalSize: number;
  indexCount: number;
  indexSize: number;
  dataTypes: { type: string; count: number }[];
}

const COLORS = ['#00ED64', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const StatsPanel: React.FC = () => {
  const { state } = useApp();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    if (!state.selectedCollection) return;

    setIsLoading(true);
    try {
      const response = await collectionApi.getStats(state.selectedCollection.id);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.selectedCollection) {
      loadStats();
    }
  }, [state.selectedCollection]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!state.selectedCollection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Collection Selected</h3>
        <p className="text-muted-foreground max-w-sm">
          Select a collection from the sidebar to view statistics.
        </p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto custom-scrollbar min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{state.selectedCollection.name}</h2>
          <p className="text-sm text-muted-foreground">Collection Statistics</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.documentCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Document Size
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats.avgDocumentSize)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Size
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats.totalSize)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Indexes
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.indexCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.indexSize)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Types Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.dataTypes && stats.dataTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dataTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data type information available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.dataTypes && stats.dataTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.dataTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percent }) =>
                        `${type} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {stats.dataTypes.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data type information available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indexes Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Indexes</CardTitle>
        </CardHeader>
        <CardContent>
          {state.selectedCollection.indexes && state.selectedCollection.indexes.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Keys</th>
                    <th className="text-left p-3 font-medium">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {state.selectedCollection.indexes.map((index, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">{index.name}</td>
                      <td className="p-3 font-mono text-xs">
                        {Object.entries(index.key || {}).map(([k, v]) => (
                          <span key={k} className="mr-2">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </td>
                      <td className="p-3">
                        {index.unique ? (
                          <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No indexes available for this collection
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
