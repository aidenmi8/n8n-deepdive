import React, { useState, useEffect } from 'react';
import { Download, Building, Loader2, AlertCircle, TestTube, User, Database, Bell, Bookmark, BarChart3, Settings } from 'lucide-react';
import { apiService } from './services/api';
import { databaseService, supabase } from './services/database';
import { dataIngestionService } from './services/dataIngestion';
import { SearchForm } from './components/SearchForm';
import { OpportunityCard } from './components/OpportunityCard';
import { OpportunityModal } from './components/OpportunityModal';
import { TestDataPage } from './components/TestDataPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { UserProfile } from './components/UserProfile';
import { AlertsManager } from './components/AlertsManager';
import { ProcurementRelease, SearchFilters } from './types/api';
import { ApiDemoPage } from './components/ApiDemopage';

interface TrackedOpportunity {
  id: string;
  title: string;
  buyer: {
    name: string;
    id: string;
  };
  tender: {
    status: string;
    title: string;
    procurementMethod: string;
    value: {
      amount: number;
      currency: string;
    };
    tenderPeriod: {
      endDate: string;
    };
    documents?: any[];
  };
  parties?: {
    roles?: string[];
    address?: {
      region?: string;
    };
  }[];
}

function App() {
  const [currentPage, setCurrentPage] = useState<'main' | 'test' | 'apiDemo' | 'analytics'>('main');
  const [releases, setReleases] = useState<ProcurementRelease[]>([]);
  const [allReleases, setAllReleases] = useState<ProcurementRelease[]>([]);
  const [filters, setFilters] = useState<SearchFilters & { keyword?: string; institution?: string; province?: string; modality?: string }>({
    dateFrom: '',
    dateTo: '',
    page: 1
  });
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<ProcurementRelease | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAlertsManager, setShowAlertsManager] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStats, setIngestionStats] = useState<any>(null);
  const [syncDateRange, setSyncDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });

  // Get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };

  // Load initial data
  useEffect(() => {
    checkUser();
    const loadInitialData = async () => {
      console.log('Loading initial data...');
      setLoading(true);
      setError(null);
      try {
        // Load filter options first
        console.log('Loading filter options...');
        const [institutionsData, provincesData, modalitiesData] = await Promise.all([
          apiService.getInstitutions(),
          apiService.getProvinces(),
          apiService.getModalities()
        ]);
        
        console.log('Filter options loaded:', {
          institutions: institutionsData.length,
          provinces: provincesData.length,
          modalities: modalitiesData.length
        });
        
        setInstitutions(institutionsData);
        setProvinces(provincesData);
        setModalities(modalitiesData);

        // Then load initial data
        const defaultDates = getDefaultDateRange();
        // Set default filters
        setFilters(prev => ({
          ...prev,
          dateFrom: defaultDates.from,
          dateTo: defaultDates.to
        }));
        
        // Load current releases
        console.log('Loading current releases...');
        const response = await apiService.getCurrentReleases(1);
        console.log('Current releases response:', response);
        
        setReleases(response.releases);
        setAllReleases(response.releases);
        setTotalResults(response.pagination.totalReleases);
        setCurrentPageNum(1);
        
        console.log(`Successfully loaded ${response.releases.length} releases`);
      } catch (error) {
        console.error('Error loading initial data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(`Error al cargar los datos iniciales: ${errorMessage}`);
        setReleases([]);
        setAllReleases([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleStartIngestion = async () => {
    if (isIngesting) return;
    
    setIsIngesting(true);
    setIngestionStats(null);
    
    try {
      const stats = await dataIngestionService.ingestHistoricalData({
        startDate: syncDateRange.startDate,
        endDate: syncDateRange.endDate,
        batchSize: 50,
        delayBetweenRequests: 1000
      }, (progress) => {
        setIngestionStats(progress);
      });
      
      setIngestionStats(stats);
      console.log('Data ingestion completed:', stats);
    } catch (error) {
      console.error('Error during data ingestion:', error);
      setError(`Error durante la ingesta de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleStopIngestion = () => {
    dataIngestionService.stopIngestion();
    setIsIngesting(false);
  };

  const handleDatabaseSearch = async () => {
    console.log('Searching database with filters:', filters);
    setLoading(true);
    setError(null);
    
    try {
      const searchFilters = {
        keyword: filters.keyword,
        entities: filters.institution ? [filters.institution] : undefined,
        regions: filters.province ? [filters.province] : undefined,
        methods: filters.modality ? [filters.modality] : undefined,
        startDate: filters.dateFrom || getDefaultDateRange().from,
        endDate: filters.dateTo || getDefaultDateRange().to,
        page: filters.page || 1,
        pageSize: 20
      };
      
      const response = await databaseService.searchReleases(searchFilters);
      console.log('Database search results:', response);
      
      // Convert database releases to ProcurementRelease format
      const convertedReleases = response.releases.map(dbRelease => {
        // If raw_data exists and is complete, use it; otherwise construct from database fields
        if (dbRelease.raw_data && dbRelease.raw_data.id) {
          return dbRelease.raw_data as ProcurementRelease;
        }
        
        // Construct ProcurementRelease from database fields
        return {
          id: dbRelease.id,
          ocid: dbRelease.ocid,
          date: dbRelease.published_date || dbRelease.created_at,
          tag: [],
          initiationType: '',
          parties: [],
          buyer: { 
            id: dbRelease.buyer_id || '', 
            name: dbRelease.buyer_name || 'Entidad no especificada' 
          },
          planning: { 
            budget: { 
              amount: { 
                amount: dbRelease.budget_amount || 0, 
                currency: dbRelease.budget_currency || 'DOP' 
              }, 
              description: '' 
            }, 
            rationale: '' 
          },
          tender: {
            id: dbRelease.id,
            title: dbRelease.title || 'Título no disponible',
            description: dbRelease.description || 'Descripción no disponible',
            status: dbRelease.status || 'unknown',
            procurementMethod: dbRelease.procurement_method || 'No especificado',
            procurementMethodDetails: dbRelease.procurement_method_details || '',
            mainProcurementCategory: dbRelease.main_procurement_category || 'No especificado',
            submissionMethod: dbRelease.submission_method || [],
            submissionMethodDetails: '',
            tenderPeriod: {
              startDate: dbRelease.start_date || '',
              endDate: dbRelease.end_date || ''
            },
            enquiryPeriod: { startDate: '', endDate: '' },
            hasEnquiries: false,
            eligibilityCriteria: '',
            awardCriteria: '',
            awardCriteriaDetails: '',
            value: {
              amount: dbRelease.budget_amount || 0,
              currency: dbRelease.budget_currency || 'DOP'
            },
            documents: dbRelease.raw_data?.tender?.documents || []
          },
          awards: dbRelease.raw_data?.awards || [],
          contracts: dbRelease.raw_data?.contracts || [],
          language: 'es',
          publishedDate: dbRelease.published_date || dbRelease.created_at
        } as ProcurementRelease;
      });
      
      setReleases(convertedReleases);
      setAllReleases(convertedReleases);
      setTotalResults(response.total);
      setCurrentPageNum(response.page);
    } catch (error) {
      console.error('Error searching database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al buscar en la base de datos: ${errorMessage}`);
      setReleases([]);
      setAllReleases([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('Starting search with filters:', filters);
    setLoading(true);
    setError(null);
    
    try {
      const searchFilters = {
        dateFrom: filters.dateFrom || getDefaultDateRange().from,
        dateTo: filters.dateTo || getDefaultDateRange().to,
        page: filters.page || 1,
        keyword: filters.keyword
      };
      
      console.log('Executing search with:', searchFilters);
      const response = await apiService.searchReleases(searchFilters);
      console.log('Search completed, applying client-side filters...');
      let filteredReleases = response.releases;
      
      // Apply client-side filters
      if (filters.institution) {
        console.log(`Filtering by institution: ${filters.institution}`);
        filteredReleases = filteredReleases.filter(release => 
          release.buyer?.name === filters.institution
        );
      }
      
      if (filters.province) {
        console.log(`Filtering by province: ${filters.province}`);
        filteredReleases = filteredReleases.filter(release => {
          const buyerParty = release.parties?.find(p => p.roles?.includes('buyer'));
          return buyerParty?.address.region === filters.province;
        });
      }
      
      if (filters.modality) {
        console.log(`Filtering by modality: ${filters.modality}`);
        filteredReleases = filteredReleases.filter(release => 
          release.tender?.procurementMethod === filters.modality
        );
      }
      
      console.log(`Final filtered results: ${filteredReleases.length} opportunities`);
      
      setReleases(filteredReleases);
      setAllReleases(response.releases);
      setTotalResults(filteredReleases.length);
      setCurrentPageNum(1);
    } catch (error) {
      console.error('Error searching releases:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al buscar oportunidades: ${errorMessage}`);
      setReleases([]);
      setAllReleases([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['OCID', 'Título', 'Entidad Compradora', 'Provincia', 'Modalidad', 'Presupuesto', 'Moneda', 'Estado', 'Fecha Límite'],
      ...releases.map(release => {
        const buyerParty = release.parties?.find(p => p.roles?.includes('buyer'));
        return [
          release.ocid ?? '',
          release.tender?.title ?? '',
          release.buyer?.name ?? '',
          buyerParty?.address.region || 'No especificado',
          release.tender?.procurementMethod ?? '',
          release.tender?.value?.amount?.toString() ?? '',
          release.tender?.value?.currency ?? '',
          release.tender?.status ?? '',
          release.tender?.tenderPeriod?.endDate ?? ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oportunidades-rfp-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFiltersChange = (newFilters: SearchFilters & { keyword?: string; institution?: string; province?: string; modality?: string }) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (pageNum: number) => {
    setFilters({ ...filters, page: pageNum });
    setCurrentPageNum(pageNum);
  };

  const handleReleaseClick = async (release: ProcurementRelease) => {
    console.log('Opening release details for:', release);
    try {
      // Try to get detailed release data, but fallback to current data if API call fails
      try {
        const detailedRelease = await apiService.getReleaseDetails(release.id);
        console.log('Detailed release data:', detailedRelease);
        setSelectedRelease(detailedRelease);
      } catch (detailError) {
        console.warn('Could not fetch detailed release data, using current data:', detailError);
        setSelectedRelease(release);
      }
    } catch (error) {
      console.error('Error loading release details:', error);
      setSelectedRelease(release);
    }
  };

  const totalPages = Math.ceil(totalResults / 20);

  if (currentPage === 'test') {
    return <TestDataPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'apiDemo') {
    return <ApiDemoPage onBack={() => setCurrentPage('test')} />;
  }
  
  if (currentPage === 'analytics') {
    return <AnalyticsPage onBack={() => setCurrentPage('main')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Portal RFP República Dominicana
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('analytics')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setCurrentPage('test')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Data
              </button>
              {user && (
                <button
                  onClick={() => setShowAlertsManager(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Alertas
                </button>
              )}
              <button
                onClick={() => setShowUserProfile(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                {user ? 'Perfil' : 'Login'}
              </button>
              <button
                onClick={handleExport}
                disabled={releases.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Form */}
      <SearchForm
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleDatabaseSearch}
        loading={loading}
        institutions={institutions}
        provinces={provinces}
        modalities={modalities}
      />

      {/* Data Ingestion Controls */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Sistema de Base de Datos</h3>
                  <p className="text-xs text-blue-700">
                    {ingestionStats ? 
                      `Procesados: ${ingestionStats.totalProcessed} | Exitosos: ${ingestionStats.totalSuccessful} | Errores: ${ingestionStats.totalFailed}` :
                      'Buscar en base de datos local para resultados más rápidos'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSearch}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Buscar API
                </button>
              </div>
            </div>
            
            {/* Date Range Controls */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={syncDateRange.startDate}
                    onChange={(e) => setSyncDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    min="2015-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isIngesting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha Final
                  </label>
                  <input
                    type="date"
                    value={syncDateRange.endDate}
                    onChange={(e) => setSyncDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    min={syncDateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isIngesting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Presets Rápidos
                  </label>
                  <select
                    onChange={(e) => {
                      const value = e.target.value;
                      const today = new Date().toISOString().split('T')[0];
                      if (value === '2024') {
                        setSyncDateRange({ startDate: '2024-01-01', endDate: today });
                      } else if (value === '2023') {
                        setSyncDateRange({ startDate: '2023-01-01', endDate: '2023-12-31' });
                      } else if (value === '2022') {
                        setSyncDateRange({ startDate: '2022-01-01', endDate: '2022-12-31' });
                      } else if (value === 'last6months') {
                        const sixMonthsAgo = new Date();
                        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                        setSyncDateRange({ startDate: sixMonthsAgo.toISOString().split('T')[0], endDate: today });
                      } else if (value === 'lastyear') {
                        const lastYear = new Date();
                        lastYear.setFullYear(lastYear.getFullYear() - 1);
                        setSyncDateRange({ startDate: lastYear.toISOString().split('T')[0], endDate: today });
                      }
                      e.target.value = ''; // Reset select
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isIngesting}
                    defaultValue=""
                  >
                    <option value="">Seleccionar período</option>
                    <option value="2024">Año 2024</option>
                    <option value="2023">Año 2023</option>
                    <option value="2022">Año 2022</option>
                    <option value="last6months">Últimos 6 meses</option>
                    <option value="lastyear">Último año</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {!isIngesting ? (
                  <button
                    onClick={handleStartIngestion}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Sincronizar Datos
                  </button>
                ) : (
                  <button
                    onClick={handleStopIngestion}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Detener
                  </button>
                )}
              </div>
            </div>
            
            {/* Sync Information */}
            {(syncDateRange.startDate && syncDateRange.endDate) && (
              <div className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                📅 <strong>Período de sincronización:</strong> {new Date(syncDateRange.startDate).toLocaleDateString('es-DO')} - {new Date(syncDateRange.endDate).toLocaleDateString('es-DO')}
                {(() => {
                  const start = new Date(syncDateRange.startDate);
                  const end = new Date(syncDateRange.endDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return ` (${diffDays} días)`;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Cargando oportunidades...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Oportunidades de Contratación
                </h2>
                <p className="text-lg text-gray-600 mt-1">
                  {totalResults.toLocaleString('es-DO')} oportunidades encontradas
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Mostrando {releases.length.toLocaleString('es-DO')} resultados con información detallada
                </p>
              </div>
              <div className="text-sm text-gray-500">
                <div className="text-right">
                  <p className="font-medium">Portal DGCP</p>
                  <p>
                Última actualización: {new Date().toLocaleDateString('es-DO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </p>
                </div>
              </div>
            </div>

            {releases.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron oportunidades
                </h3>
                <p className="text-gray-500">
                  Intenta ajustar los filtros de búsqueda
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleSearch}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Buscar API
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                  <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <div className="flex items-center space-x-4">
                        <span>Oportunidades de Contratación Pública</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Datos en tiempo real del Portal DGCP
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <span>{releases.length} oportunidades</span>
                        <span>
                          {releases.filter(r => r.tender?.documents && r.tender.documents.length > 0).length} con documentos
                        </span>
                        <span>
                          {releases.filter(r => r.tender?.status === 'active').length} activas
                        </span>
                      </div>
                    </div>
                  </div>
                  {releases.map((release) => (
                    <OpportunityCard
                      key={release.id}
                      release={release}
                      onClick={() => handleReleaseClick(release)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPageNum - 1)}
                      disabled={currentPageNum === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPageNum;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPageNum + 1)}
                      disabled={currentPageNum === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selectedRelease && (
        <OpportunityModal
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}

      {/* Alerts Manager Modal */}
      {showAlertsManager && user && (
        <AlertsManager 
          onClose={() => setShowAlertsManager(false)} 
          userId={user.id}
        />
      )}
    </div>
  );
}

export default App;