import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download, AlertCircle } from 'lucide-react';

interface DocumentViewerProps {
  documentData: {
    title: string;
    url: string;
    documentType?: string;
  };
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentData, onClose }) => {
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Most government sites block iframe embedding, so show alternatives immediately
    const timer = setTimeout(() => {
      setLoading(false);
      setShowError(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = documentData.url;
      link.download = documentData.title || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(documentData.url, '_blank');
    }
  };

  const handleOpenExternal = () => {
    window.open(documentData.url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{documentData.title}</h2>
            {documentData.documentType && (
              <p className="text-sm text-gray-500">{documentData.documentType}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && !showError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando documento...</p>
              </div>
            </div>
          )}

          {showError ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md mx-auto p-6">
                <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se puede mostrar el documento
                </h3>
                <p className="text-gray-600 mb-6">
                  Este documento no puede mostrarse directamente debido a las políticas de seguridad del sitio web del gobierno. 
                  Utilice las opciones a continuación para acceder al documento.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleOpenExternal}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Abrir en Nueva Ventana
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Descargar Documento
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>URL del documento:</strong><br />
                    <span className="font-mono break-all">{documentData.url}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={documentData.url}
              className="w-full h-full border-0"
              title={documentData.title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setShowError(true);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Documento del Portal de Compras Públicas de República Dominicana
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenExternal}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Abrir en Nueva Ventana
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};