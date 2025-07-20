import React from 'react';
import { X, Building, MapPin, Tag, DollarSign, Calendar, Clock, FileText, ExternalLink, Download } from 'lucide-react';
import { ProcurementRelease } from '../types/api';

interface OpportunityModalProps {
  release: ProcurementRelease;
  onClose: () => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({ release, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'DOP'
    }).format(amount);
  };

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

  const handleViewInPortal = () => {
    window.open(`https://portal.comprasdominicana.gob.do/oportunidad/${release.id}`, '_blank');
  };

  const buyerParty = release.parties?.find(p => p.roles?.includes('buyer'));
  const tenderStatus = release.tender?.status ?? 'unknown';
  const startDate = release.tender?.tenderPeriod?.startDate;
  const endDate = release.tender?.tenderPeriod?.endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalle de la Oportunidad
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Header Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenderStatus)}`}>
                {tenderStatus}
              </span>
              <span className="text-sm text-gray-500">
                Ref: {release.ocid ?? 'No disponible'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {release.tender?.title ?? 'Título no disponible'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {release.tender?.description ?? 'Descripción no disponible'}
            </p>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Entidad Compradora
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{release.buyer?.name ?? 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Provincia
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{buyerParty?.address.region || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Modalidad
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{release.tender?.procurementMethod ?? 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoría Principal
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{release.tender?.mainProcurementCategory ?? 'No especificado'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Presupuesto
                  </label>
                  <p className="text-lg font-semibold text-green-600 mt-1">
                    {release.tender?.value?.amount ? formatCurrency(release.tender.value.amount, release.tender.value.currency ?? 'DOP') : 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Inicio del Período
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{startDate ? formatDate(startDate) : 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha Límite
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{endDate ? formatDate(endDate) : 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Método de Presentación
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{release.tender?.submissionMethod?.join(', ') ?? 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          {release.tender?.documents && release.tender.documents.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Documentos Relacionados ({release.tender.documents.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {release.tender.documents.map((doc) => (
                  <div key={doc.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {doc.title ?? 'Documento sin título'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{doc.documentType ?? 'Tipo no especificado'}</p>
                        {doc.format && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">{doc.format.toUpperCase()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => doc.url && window.open(doc.url, '_blank')}
                        className="flex-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 inline mr-1" />
                        Abrir
                      </button>
                      <button
                        onClick={() => {
                          if (doc.url) {
                            const link = document.createElement('a');
                            link.href = doc.url;
                            link.download = doc.title || 'documento';
                            link.click();
                          }
                        }}
                        className="flex-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                      >
                        <Download className="h-3 w-3 inline mr-1" />
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleViewInPortal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors inline-flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver en Portal Oficial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};