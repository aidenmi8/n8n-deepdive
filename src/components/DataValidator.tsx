import React, { useState, useEffect } from 'react';
import { Search, Database, CheckCircle, AlertTriangle, XCircle, Loader2, Eye, FileText } from 'lucide-react';
import { SearchForm } from './SearchForm';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityModal } from './OpportunityModal';
import { databaseService } from '../services/database';
import { ProcurementRelease, SearchFilters } from '../types/api';

interface DataValidatorProps {
  institutions: string[];
  provinces: string[];
  modalities: string[];
}

export const DataValidator: React.FC<DataValidatorProps> = ({
  institutions,
  provinces,
  modalities
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<ProcurementRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters & { 
    keyword?: string; 
    institution?: string; 
    province?: string; 
    modality?: string 
  }>({
    dateFrom: '',
    dateTo: '',
    page: 1
  });
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [validationStats, setValidationStats] = useState({
    totalRecords: 0,
    withDocuments: 0,
    activeOpportunities: 0,
    completedOpportunities: 0,
    averageBudget: 0,
    dateRange: { earliest: '', latest: '' }
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

  useEffect(() => {
    // Load initial data on component mount
    handleSearch();
  }, []);

  const handleSearch = async () => {
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
      
      console.log('Database search with filters:', searchFilters);
      
      const response = await databaseService.searchReleases(searchFilters);
      
      setResults(response.releases);
      setTotalResults(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      
      // Calculate validation statistics
      const stats = calculateValidationStats(response.releases);
      setValidationStats(stats);
      
      console.log(`Found ${response.releases.length} results from database`);
      
    } catch (error) {
      console.error('Error searching database:', error);
      setError(`Error searching database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateValidationStats = (releases: any[]) => {
    const stats = {
      totalRecords: releases.length,
      withDocuments: 0,
      activeOpportunities: 0,
      completedOpportunities: 0,
      averageBudget: 0,
      dateRange: { earliest: '', latest: '' }
    };

    if (releases.length === 0) return stats;

    let totalBudget = 0;
    let budgetCount = 0;
    const dates: Date[] = [];

    releases.forEach(release => {
      // Count releases with documents
      if (release.raw_data?.tender?.documents && release.raw_data.tender.documents.length > 0) {
        stats.withDocuments++;
      }

      // Count by status
      const status = release.status?.toLowerCase();
      if (status === 'active' || status === 'planning') {
        stats.activeOpportunities++;
      } else if (status === 'complete' || status === 'awarded') {
        stats.completedOpportunities++;
      }

      // Calculate average budget
      if (release.budget_amount && release.budget_amount > 0) {
        totalBudget += release.budget_amount;
        budgetCount++;
      }

      // Track dates
      if (release.published_date) {
        dates.push(new Date(release.published_date));
      }
    });

    stats.averageBudget = budgetCount > 0 ? totalBudget / budgetCount : 0;

    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      stats.dateRange.earliest = dates[0].toISOString().split('T')[0];
      stats.dateRange.latest = dates[dates.length - 1].toISOString().split('T')[0];
    }

    return stats;
  };

  const handleFiltersChange = (newFilters: SearchFilters & { 
    keyword?: string; 
    institution?: string; 
    province?: string; 
    modality?: string 
  }) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (pageNum: number) => {
    setFilters({ ...filters, page: pageNum });
    setCurrentPage(pageNum);
    // Trigger search with new page
    handleSearch();
  };

  const handleReleaseClick = (release: any) => {
    // Convert database release to ProcurementRelease format
    const procurementRelease: ProcurementRelease = release.raw_data || {
      id: release.id,
      ocid: release.ocid,
      date: release.published_date || '',
      tag: [],
      initiationType: '',
      parties: [],
      buyer: { id: release.buyer_id || '', name: release.buyer_name || '' },
      planning: { budget: { amount: { amount: 0, currency: 'DOP' }, description: '' }, rationale: '' },
      tender: {
        id: release.id,
        title: release.title || '',
        description: release.description || '',
        status: release.status || '',
        procurementMethod: release.procurement_method || '',
        procurementMethodDetails: release.procurement_method_details || '',
        mainProcurementCategory: release.main_procurement_category || '',
        submissionMethod: release.submission_method || [],
        submissionMethodDetails: '',
        tenderPeriod: {
          startDate: release.start_date || '',
          endDate: release.end_date || ''
        },
        enquiryPeriod: { startDate: '', endDate: '' },
        hasEnquiries: false,
        eligibilityCriteria: '',
        awardCriteria: '',
        awardCriteriaDetails: '',
        value: {
          amount: release.budget_amount || 0,
          currency: release.budget_currency || 'DOP'
        },
        documents: []
      },
      awards: [],
      contracts: [],
      language: 'es',
      publishedDate: release.published_date || ''
    };
    
    setSelectedRelease(procurementRelease);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Validator</h3>
            <p className="text-gray-600 mt-1">
              Query and validate data stored in the Supabase database
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Database className="h-4 w-4" />
            <span>Direct Database Access</span>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h4 className="text-md font-semibold text-gray-900">Search & Filter Database</h4>
        </div>
        <div className="p-6">
          <SearchForm
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            loading={loading}
            institutions={institutions}
            provinces={provinces}
            modalities={modalities}
          />
        </div>
      </div>

      {/* Validation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.totalRecords}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Documents</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.withDocuments}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{validationStats.activeOpportunities}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Budget</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(validationStats.averageBudget)}
              </p>
            </div>
            <Database className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Date Range Info */}
      {validationStats.dateRange.earliest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Date Range:</span>
            <span className="text-blue-700">
              {new Date(validationStats.dateRange.earliest).toLocaleDateString('es-DO')} - 
              {new Date(validationStats.dateRange.latest).toLocaleDateString('es-DO')}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">
              Database Query Results
            </h4>
            <div className="text-sm text-gray-500">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                `${totalResults.toLocaleString()} total results`
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500">Searching database...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <div>
            {results.map((release) => {
              // Convert database release to display format
              const displayRelease: ProcurementRelease = {
                id: release.id,
                ocid: release.ocid,
                date: release.published_date || '',
                tag: [],
                initiationType: '',
                parties: [],
                buyer: { id: release.buyer_id || '', name: release.buyer_name || '' },
                planning: { budget: { amount: { amount: 0, currency: 'DOP' }, description: '' }, rationale: '' },
                tender: {
                  id: release.id,
                  title: release.title || '',
                  description: release.description || '',
                  status: release.status || '',
                  procurementMethod: release.procurement_method || '',
                  procurementMethodDetails: release.procurement_method_details || '',
                  mainProcurementCategory: release.main_procurement_category || '',
                  submissionMethod: release.submission_method || [],
                  submissionMethodDetails: '',
                  tenderPeriod: {
                    startDate: release.start_date || '',
                    endDate: release.end_date || ''
                  },
                  enquiryPeriod: { startDate: '', endDate: '' },
                  hasEnquiries: false,
                  eligibilityCriteria: '',
                  awardCriteria: '',
                  awardCriteriaDetails: '',
                  value: {
                    amount: release.budget_amount || 0,
                    currency: release.budget_currency || 'DOP'
                  },
                  documents: release.raw_data?.tender?.documents || []
                },
                awards: [],
                contracts: [],
                language: 'es',
                publishedDate: release.published_date || ''
              };

              return (
                <OpportunityCard
                  key={release.id}
                  release={displayRelease}
                  onClick={() => handleReleaseClick(release)}
                />
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 p-6 border-t">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
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
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedRelease && (
        <OpportunityModal
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
        />
      )}
    </div>
  );
};