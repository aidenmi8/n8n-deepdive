import React from 'react';
import { Calendar, MapPin, Building, Tag, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, FileText, Eye, ChevronRight } from 'lucide-react';
import { ProcurementRelease } from '../types/api';

interface OpportunityCardProps {
  release: ProcurementRelease;
  onClick: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ release, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'planning':
        return 'bg-green-100 text-green-800';
      case 'complete':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'awarded':
        return 'bg-blue-100 text-blue-800';
      case 'unsuccessful':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'planning':
        return <CheckCircle className="w-4 h-4" />;
      case 'complete':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'awarded':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'DOP'
    }).format(amount);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const tenderStatus = release.tender?.status ?? 'unknown';
  const isActive = tenderStatus.toLowerCase() === 'active' || tenderStatus.toLowerCase() === 'planning';
  const endDate = release.tender?.tenderPeriod?.endDate;
  const daysUntilDeadline = endDate ? getDaysUntilDeadline(endDate) : 0;
  const buyerParty = release.parties?.find(p => p.roles?.includes('buyer'));

  return (
    <div
      className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tenderStatus)}`}>
                {getStatusIcon(tenderStatus)}
                <span className="ml-1 capitalize">{tenderStatus}</span>
              </span>
              <span className="text-xs text-gray-500">
                Ref: {release.ocid ?? 'No disponible'}
              </span>
              {isActive && endDate && daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Urgente
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {release.tender?.title ?? 'Título no disponible'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {release.tender?.description ?? 'Descripción no disponible'}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1" />
                <span className="truncate max-w-48" title={release.buyer?.name ?? 'Institución no especificada'}>
                  {release.buyer?.name ?? 'Institución no especificada'}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{buyerParty?.address?.region || 'No especificado'}</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                <span title={release.tender?.procurementMethod ?? 'Modalidad no especificada'}>
                  {release.tender?.procurementMethod ?? 'Modalidad no especificada'}
                </span>
              </div>
              {/* Show document count if available */}
              {release.tender?.documents && release.tender.documents.length > 0 && (
                <div className="flex items-center text-blue-600">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>{release.tender.documents.length} docs</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right section - Budget and dates */}
          <div className="flex items-center space-x-6 ml-4">
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600">
                {release.tender?.value?.amount ? formatCurrency(release.tender.value.amount, release.tender.value.currency ?? 'DOP') : 'Presupuesto no disponible'}
              </div>
              <div className="text-xs text-gray-500">
                Presupuesto
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-900">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{endDate ? formatDate(endDate) : 'No especificado'}</span>
              </div>
              {isActive && endDate && (
                <div className="flex items-center justify-end text-xs mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className={daysUntilDeadline <= 7 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} días` : 'Vencido'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};