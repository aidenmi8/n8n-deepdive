import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Building, Users, Calendar, ArrowLeft, Database, Loader2, Play, Square } from 'lucide-react';
import { databaseService } from '../services/database';
import { dataIngestionService } from '../services/dataIngestion';

interface AnalyticsPageProps {
  onBack: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [pricingIntelligence, setPricingIntelligence] = useState<any[]>([]);
  const [procurementStats, setProcurementStats] = useState<any>({
    totalEntities: 0,
    totalValue: 0,
    totalOpportunities: 0,
    recentReleases: []
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'datasync'>('overview');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStats, setIngestionStats] = useState<any>(null);
  const [syncDateRange, setSyncDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [syncedData, setSyncedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [vendors, pricing, procurementData] = await Promise.all([
        databaseService.getVendorPerformance(),
        databaseService.getPricingIntelligence(),
        loadProcurementStats()
      ]);
      
      setVendorPerformance(vendors.slice(0, 10)); // Top 10
      setPricingIntelligence(pricing.slice(0, 10));
      setProcurementStats(procurementData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcurementStats = async () => {
    try {
      // Get basic statistics from the procurement_releases table
      const searchResult = await databaseService.searchReleases({
        pageSize: 1000 // Get a large sample to calculate stats
      });
      
      const releases = searchResult.releases;
      
      // Calculate basic statistics
      const totalValue = releases.reduce((sum, release) => {
        const amount = release.budget_amount || 0;
        return sum + amount;
      }, 0);
      
      const uniqueEntities = new Set(
        releases.map(r => r.buyer_name).filter(name => name)
      );
      
      // Get recent releases for display
      const recentReleases = releases
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      return {
        totalEntities: uniqueEntities.size,
        totalValue: totalValue,
        totalOpportunities: searchResult.total,
        recentReleases: recentReleases
      };
    } catch (error) {
      console.error('Error loading procurement stats:', error);
      return {
        totalEntities: 0,
        totalValue: 0,
        totalOpportunities: 0,
        recentReleases: []
      };
    }
  };

  const handleStartIngestion = async () => {
    if (isIngesting) return;
    
    setIsIngesting(true);
    setIngestionStats(null);
    setSyncedData([]);
    
    try {
      const stats = await dataIngestionService.ingestHistoricalData({
        startDate: syncDateRange.startDate,
        endDate: syncDateRange.endDate,
        batchSize: 20, // Smaller batch for testing
        delayBetweenRequests: 500
      }, (progress) => {
        setIngestionStats(progress);
      });
      
      setIngestionStats(stats);
      
      // Reload analytics data after ingestion
      await loadAnalyticsData();
      
    } catch (error) {
      console.error('Error during data ingestion:', error);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleStopIngestion = () => {
    dataIngestionService.stopIngestion();
    setIsIngesting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics & Inteligencia de Precios
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entidades</p>
                <p className="text-2xl font-bold text-gray-900">{procurementStats.totalEntities.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(procurementStats.totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{vendorPerformance.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-2xl font-bold text-gray-900">{procurementStats.totalOpportunities.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Vendors */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Top Proveedores por Valor</h3>
            </div>
            <div className="p-6">
              {vendorPerformance.length === 0 ? (
                <div>
                  <p className="text-gray-500 text-center py-4">
                    Analytics de proveedores no generados aún.<br />
                    <span className="text-sm">Mostrando datos de oportunidades recientes:</span>
                  </p>
                  {procurementStats.recentReleases.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 mb-3">Oportunidades Recientes ({procurementStats.recentReleases.length})</h4>
                      {procurementStats.recentReleases.slice(0, 5).map((release, index) => (
                        <div key={release.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{release.title || 'Sin título'}</p>
                            <p className="text-sm text-gray-500">{release.buyer_name || 'Entidad no especificada'}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-green-600">
                              {formatCurrency(release.budget_amount || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {release.status || 'Estado desconocido'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorPerformance.map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{vendor.vendor_name}</p>
                          <p className="text-sm text-gray-500">{vendor.total_awards} contratos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(vendor.total_value)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Prom: {formatCurrency(vendor.average_award_value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Intelligence */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Inteligencia de Precios por Categoría</h3>
            </div>
            <div className="p-6">
              {pricingIntelligence.length === 0 ? (
                <div>
                  <p className="text-gray-500 text-center py-4">
                    Inteligencia de precios no generada aún.<br />
                    <span className="text-sm">Mostrando distribución por categorías:</span>
                  </p>
                  {procurementStats.recentReleases.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 mb-3">Categorías Principales</h4>
                      {(() => {
                        // Group by category and calculate totals
                        const categoryStats = procurementStats.recentReleases.reduce((acc: any, release: any) => {
                          const category = release.main_procurement_category || 'Sin categoría';
                          if (!acc[category]) {
                            acc[category] = { count: 0, totalValue: 0 };
                          }
                          acc[category].count++;
                          acc[category].totalValue += release.budget_amount || 0;
                          return acc;
                        }, {});
                        
                        return Object.entries(categoryStats)
                          .sort(([,a]: any, [,b]: any) => b.totalValue - a.totalValue)
                          .slice(0, 5)
                          .map(([category, stats]: [string, any]) => (
                            <div key={category} className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Oportunidades</p>
                                  <p className="font-semibold">{stats.count}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Valor Total</p>
                                  <p className="font-semibold">{formatCurrency(stats.totalValue)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Promedio</p>
                                  <p className="font-semibold">{formatCurrency(stats.totalValue / stats.count)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">% del Total</p>
                                  <p className="font-semibold">{((stats.totalValue / procurementStats.totalValue) * 100).toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {pricingIntelligence.map((category, index) => (
                    <div key={category.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Promedio</p>
                          <p className="font-semibold">{formatCurrency(category.average_value)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Mediana</p>
                          <p className="font-semibold">{formatCurrency(category.median_value)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Mínimo</p>
                          <p className="font-semibold">{formatCurrency(category.min_value)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Máximo</p>
                          <p className="font-semibold">{formatCurrency(category.max_value)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Basado en {category.sample_size} oportunidades
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Ingestion Instructions */}
        {procurementStats.totalOpportunities === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Sincronizar Datos</h3>
                <p className="text-blue-700 mt-1">
                  No hay datos en la base de datos. Sincronice los datos desde la página principal para ver analytics.
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  Vaya a la página principal → haga clic en "Sincronizar Datos" → espere que se complete la ingesta
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Show processing suggestion if we have basic data but no analytics */}
        {procurementStats.totalOpportunities > 0 && vendorPerformance.length === 0 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Datos Sincronizados ✅</h3>
                <p className="text-green-700 mt-1">
                  Se encontraron {procurementStats.totalOpportunities.toLocaleString()} oportunidades en la base de datos.
                  Los analytics procesados se generarán automáticamente.
                </p>
                <div className="mt-3 text-sm text-green-600">
                  <p>• <strong>{procurementStats.totalEntities}</strong> entidades compradoras</p>
                  <p>• <strong>{formatCurrency(procurementStats.totalValue)}</strong> en valor total de contratos</p>
                  <p>• <strong>{procurementStats.recentReleases.length}</strong> oportunidades recientes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};