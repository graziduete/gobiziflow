"use client";

import { useState } from "react";
import { SustentacaoDashboard } from '@/components/sustentacao/dashboard';
import { CompanySelector } from '@/components/sustentacao/company-selector';

export default function SustentacaoPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const handleBackToSelector = () => {
    setSelectedCompanyId(null);
  };

  return (
    <div className="space-y-6">
      {!selectedCompanyId ? (
        <CompanySelector 
          onCompanySelect={handleCompanySelect}
          selectedCompanyId={selectedCompanyId || undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToSelector}
                className="text-blue-600 hover:text-blue-700 text-lg font-medium p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="Voltar para seleção"
              >
                ←
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Sustentação</h1>
            </div>
          </div>
          <SustentacaoDashboard companyId={selectedCompanyId} />
        </div>
      )}
    </div>
  );
}