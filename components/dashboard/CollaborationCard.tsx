'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CollaborationMetrics } from '@/types';

interface CollaborationCardProps {
  metrics: CollaborationMetrics;
}

function getBusFactorColor(busFactor: number): string {
  if (busFactor >= 3) return 'text-green-600';
  if (busFactor === 2) return 'text-yellow-600';
  return 'text-red-600';
}

function getRiskBadgeVariant(risk: 'high' | 'medium' | 'low'): 'destructive' | 'secondary' | 'outline' {
  if (risk === 'high') return 'destructive';
  if (risk === 'medium') return 'secondary';
  return 'outline';
}

export function CollaborationCard({ metrics }: CollaborationCardProps) {
  const { busFactor, knowledgeSilos, collaborationScore } = metrics;

  const highRiskSilos = knowledgeSilos.filter((s) => s.riskLevel === 'high');
  const mediumRiskSilos = knowledgeSilos.filter((s) => s.riskLevel === 'medium');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Collaboration</span>
          <Badge variant={collaborationScore >= 70 ? 'secondary' : 'destructive'}>
            Score: {collaborationScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bus Factor */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-4xl font-bold ${getBusFactorColor(busFactor)}`}>
            {busFactor}
          </div>
          <div className="text-sm text-gray-600 mt-1">Bus Factor</div>
          <p className="text-xs text-gray-400 mt-2">
            {busFactor === 1
              ? 'Critical risk: Single point of failure'
              : busFactor === 2
              ? 'Moderate risk: Knowledge concentrated'
              : 'Healthy: Knowledge well distributed'}
          </p>
        </div>

        {/* Knowledge Silos */}
        {(highRiskSilos.length > 0 || mediumRiskSilos.length > 0) && (
          <div>
            <h4 className="text-sm font-medium mb-3">Knowledge Silos</h4>
            <div className="space-y-2">
              {knowledgeSilos
                .filter((s) => s.riskLevel !== 'low')
                .slice(0, 5)
                .map((silo) => (
                  <div
                    key={silo.email}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{silo.contributor}</p>
                      <p className="text-xs text-gray-500">
                        {silo.exclusiveFiles.length} exclusive area{silo.exclusiveFiles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={getRiskBadgeVariant(silo.riskLevel)}>
                      {silo.riskLevel}
                    </Badge>
                  </div>
                ))}
            </div>
            {knowledgeSilos.filter((s) => s.riskLevel !== 'low').length > 5 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                +{knowledgeSilos.filter((s) => s.riskLevel !== 'low').length - 5} more
              </p>
            )}
          </div>
        )}

        {/* No silos message */}
        {highRiskSilos.length === 0 && mediumRiskSilos.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No significant knowledge silos detected</p>
            <p className="text-xs text-gray-400 mt-1">
              Knowledge is well distributed across the team
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
