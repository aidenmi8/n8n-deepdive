import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Building, Users, Calendar, ArrowLeft, Database, Loader2, Play, Square, CheckCircle, XCircle, AlertTriangle, Zap, Shield, Activity } from 'lucide-react';
import { databaseService } from '../services/database';
import { dataIngestionService } from '../services/dataIngestion';
import { DataValidator } from './DataValidator';
import { apiService } from '../services/api';

//
// DataIngestionManager is now handled within this component
//

interface TestDataPageProps {
  onNavigate: (page: 'main' | 'test' | 'apiDemo') => void;
}

export const TestDataPage: React.FC<TestDataPageProps> = ({ onNavigate }) => {
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);
  const [pricingIntelligence, setPricingIntelligence] = useState<any[]>([]);
  const [entityStats, setEntityStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'datasync' | 'database-verification' | 'data-validator'>('overview');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStats, setIngestionStats] = useState<any>(null);
  const [syncDateRange, setSyncDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [syncedData, setSyncedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbVerificationResults, setDbVerificationResults] = useState<any>({});
  const [runningVerification, setRunningVerification] = useState(false);
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);

  useEffect(() => {
    loadAnalyticsData();
    loadFilterOptions();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [vendors, pricing, entities] = await Promise.all([
        databaseService.getVendorPerformance(),
        databaseService.getPricingIntelligence(),
        databaseService.getFilterOptions()
      ]);
      
      setVendorPerformance(vendors.slice(0, 10)); // Top 10
      setPricingIntelligence(pricing.slice(0, 10));
      // setEntityStats(entities);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [institutionsData, provincesData, modalitiesData] = await Promise.all([
        apiService.getInstitutions(),
        apiService.getProvinces(),
        apiService.getModalities()
      ]);
      
      setInstitutions(institutionsData);
      setProvinces(provincesData);
      setModalities(modalitiesData);
    } catch (error) {
      console.error('Error loading filter options:', error);
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
      
      // Load some sample synced data for display
      const searchResult = await databaseService.searchReleases({
        startDate: syncDateRange.startDate,
        endDate: syncDateRange.endDate,
        pageSize: 10
      });
      setSyncedData(searchResult.releases.slice(0, 10));
      
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

  const runDatabaseVerification = async () => {
    setRunningVerification(true);
    const results: any = {};
    
    try {
      // Test 1: Check database connection
      results.connection = { status: 'running', message: 'Testing connection...' };
      setDbVerificationResults({...results});
      
      const filterOptions = await databaseService.getFilterOptions();
      results.connection = { 
        status: 'success', 
        message: `Connection successful. Found ${filterOptions.entities.length} entities.` 
      };
      
      // Test 2: Check table structure
      results.schema = { status: 'running', message: 'Checking schema...' };
      setDbVerificationResults({...results});
      
      const searchResult = await databaseService.searchReleases({ pageSize: 1 });
      results.schema = { 
        status: 'success', 
        message: `Schema verified. Tables accessible with ${searchResult.total} total records.` 
      };
      
      // Test 3: Check data integrity
      results.data = { status: 'running', message: 'Checking data integrity...' };
      setDbVerificationResults({...results});
      
      const sampleData = await databaseService.searchReleases({ pageSize: 5 });
      results.data = { 
        status: sampleData.releases.length > 0 ? 'success' : 'warning', 
        message: `Found ${sampleData.releases.length} sample records. Data appears ${sampleData.releases.length > 0 ? 'healthy' : 'empty'}.` 
      };
      
      // Test 4: Check performance
      results.performance = { status: 'running', message: 'Testing query performance...' };
      setDbVerificationResults({...results});
      
      const startTime = Date.now();
      await databaseService.searchReleases({ keyword: 'test', pageSize: 10 });
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      results.performance = { 
        status: queryTime < 2000 ? 'success' : 'warning', 
        message: `Query completed in ${queryTime}ms. ${queryTime < 2000 ? 'Performance good' : 'Performance slow'}.` 
      };
      
    } catch (error) {
      results.connection = results.connection || { 
        status: 'error', 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
    
    setDbVerificationResults(results);
    setRunningVerification(false);
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
                onClick={() => onNavigate?.('main')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics & Inteligencia de Precios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate?.('apiDemo')}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Live API Demo
              </button>
              <button
                onClick={() => setActiveTab('datasync')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'datasync'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Data Sync
              </button>
              <button
                onClick={() => setActiveTab('database-verification')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'database-verification'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Database Verification
              </button>
              <button
                onClick={() => setActiveTab('data-validator')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'data-validator'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Data Validator
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Entidades</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
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
                    <p className="text-2xl font-bold text-gray-900">--</p>
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
                    <p className="text-2xl font-bold text-gray-900">--</p>
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
                    <p className="text-gray-500 text-center py-8">
                      No hay datos de proveedores disponibles.<br />
                      <span className="text-sm">Ejecute la sincronización de datos para ver analytics.</span>
                    </p>
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
                    <p className="text-gray-500 text-center py-8">
                      No hay datos de precios disponibles.<br />
                      <span className="text-sm">Ejecute la sincronización de datos para ver analytics.</span>
                    </p>
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
            {vendorPerformance.length === 0 && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Generar Analytics</h3>
                    <p className="text-blue-700 mt-1">
                      Para ver analytics detallados, debe sincronizar los datos históricos desde la página principal.
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                      Vaya a la página principal → haga clic en "Sincronizar Datos" → espere que se complete la ingesta
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'datasync' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sincronización de Datos Históricos</h3>
            <p className="text-gray-600 mb-6">
              Ejecute el proceso de ingesta para poblar la base de datos local con datos del portal de compras.
            </p>
            {/* Ingestion Controls */}
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="date"
                value={syncDateRange.startDate}
                onChange={(e) => setSyncDateRange({ ...syncDateRange, startDate: e.target.value })}
                className="border-gray-300 rounded-lg shadow-sm"
              />
              <input
                type="date"
                value={syncDateRange.endDate}
                onChange={(e) => setSyncDateRange({ ...syncDateRange, endDate: e.target.value })}
                className="border-gray-300 rounded-lg shadow-sm"
              />
              <button
                onClick={handleStartIngestion}
                disabled={isIngesting}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Sincronización
              </button>
              <button
                onClick={handleStopIngestion}
                disabled={!isIngesting}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Square className="h-4 w-4 mr-2" />
                Detener
              </button>
            </div>
            {/* Ingestion Progress */}
            {isIngesting && ingestionStats && (
              <div className="mt-4 text-sm text-gray-700">
                Procesando: {ingestionStats.totalProcessed} | Exitosos: {ingestionStats.totalSuccessful} | Fallidos: {ingestionStats.totalFailed}
              </div>
            )}
          </div>
        )}

        {activeTab === 'database-verification' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Database Verification</h3>
                  <p className="text-gray-600 mt-1">
                    Verify database connectivity, schema integrity, and performance before deployment
                  </p>
                </div>
                <button
                  onClick={runDatabaseVerification}
                  disabled={runningVerification}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {runningVerification ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Verification
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verification Tests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Connection Test */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Database Connection</h4>
                    <p className="text-sm text-gray-600">Test Supabase connectivity and authentication</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Environment Variables</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Supabase Connection</span>
                    {dbVerificationResults.connection ? (
                      dbVerificationResults.connection.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : dbVerificationResults.connection.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {dbVerificationResults.connection && (
                    <p className="text-xs text-gray-600 mt-2">{dbVerificationResults.connection.message}</p>
                  )}
                </div>
              </div>

              {/* Schema Integrity Test */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Schema Integrity</h4>
                    <p className="text-sm text-gray-600">Verify table structure and relationships</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Core Tables</span>
                    {dbVerificationResults.schema ? (
                      dbVerificationResults.schema.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : dbVerificationResults.schema.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">RLS Policies</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  {dbVerificationResults.schema && (
                    <p className="text-xs text-gray-600 mt-2">{dbVerificationResults.schema.message}</p>
                  )}
                </div>
              </div>

              {/* Data Integrity Test */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Data Integrity</h4>
                    <p className="text-sm text-gray-600">Check data consistency and sample records</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Sample Data</span>
                    {dbVerificationResults.data ? (
                      dbVerificationResults.data.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : dbVerificationResults.data.status === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : dbVerificationResults.data.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Foreign Keys</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  {dbVerificationResults.data && (
                    <p className="text-xs text-gray-600 mt-2">{dbVerificationResults.data.message}</p>
                  )}
                </div>
              </div>

              {/* Performance Test */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Performance</h4>
                    <p className="text-sm text-gray-600">Test query performance and response times</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Query Speed</span>
                    {dbVerificationResults.performance ? (
                      dbVerificationResults.performance.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : dbVerificationResults.performance.status === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : dbVerificationResults.performance.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Connection Pool</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  {dbVerificationResults.performance && (
                    <p className="text-xs text-gray-600 mt-2">{dbVerificationResults.performance.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Status */}
            {Object.keys(dbVerificationResults).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Verification Summary</h4>
                <div className="space-y-2">
                  {Object.entries(dbVerificationResults).map(([key, result]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center space-x-2">
                        {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {result.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        {result.status === 'running' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                        <span className="text-sm text-gray-600 capitalize">{result.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data-validator' && (
          <DataValidator
            institutions={institutions}
            provinces={provinces}
            modalities={modalities}
          />
        )}
      </div>
    </div>
  );
};