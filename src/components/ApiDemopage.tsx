import React, { useState } from 'react';
import { apiService } from '../services/api';
import { ProcurementRelease } from '../types/api';
import { Loader2, AlertCircle, Server, ChevronLeft, ChevronRight, Calendar, FileText, Building } from 'lucide-react';

interface ApiDemoPageProps {
  onBack: () => void;
}

export const ApiDemoPage: React.FC<ApiDemoPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProcurementRelease[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReleases, setTotalReleases] = useState(0);
  const [dateRange, setDateRange] = useState({
    dateFrom: '2024-01-01',
    dateTo: new Date().toISOString().split('T')[0]
  });
  const [fetchedPages, setFetchedPages] = useState<number[]>([]);

  const fetchData = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching page ${page} for date range: ${dateRange.dateFrom} to ${dateRange.dateTo}`);
      
      const response = await apiService.getReleasesByDate({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page: page,
      });

      console.log('API Response:', {
        releasesCount: response.releases.length,
        pagination: response.pagination
      });

      setData(response.releases);
      setCurrentPage(page);
      setTotalPages(response.pagination.totalPages);
      setTotalReleases(response.pagination.totalReleases);
      
      // Track which pages we've fetched
      setFetchedPages(prev => [...new Set([...prev, page])]);
      
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage);
    }
  };

  const handleDateRangeChange = () => {
    setFetchedPages([]);
    setCurrentPage(1);
    fetchData(1);
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Server className="mr-3 text-blue-600" />
          Live API Data Fetch Demo - Multi-Page Testing
        </h2>
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          &larr; Back to Test Data
        </button>
      </div>

      <div className="prose max-w-none mb-6">
        <p>
          This demo allows you to test fetching multiple pages of data from the official government procurement API. 
          Configure the date range and fetch different pages to test pagination and data consistency.
        </p>
      </div>

      {/* Date Range Controls */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">API Testing Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha desde
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateRange.dateFrom}
                onChange={(e) => setDateRange(prev => ({...prev, dateFrom: e.target.value}))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha hasta
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateRange.dateTo}
                onChange={(e) => setDateRange(prev => ({...prev, dateTo: e.target.value}))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={handleDateRangeChange}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Fetching...
              </>
            ) : (
              'Fetch Data'
            )}
          </button>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-blue-900">Pagination Testing</h4>
              <p className="text-sm text-blue-700">
                Total: {totalReleases.toLocaleString()} releases across {totalPages} pages
              </p>
            </div>
            <div className="text-sm text-blue-600">
              Fetched pages: {fetchedPages.sort((a, b) => a - b).join(', ') || 'None'}
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;
              
              const isActive = page === currentPage;
              const wasFetched = fetchedPages.includes(page);
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : wasFetched
                      ? 'text-blue-700 bg-blue-100 border border-blue-300 hover:bg-blue-200'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} | Showing {data?.length || 0} releases
            </span>
          </div>
        </div>
      )}

      {/* Quick Test Buttons */}
      {totalPages >= 3 && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h4 className="text-lg font-semibold text-green-900 mb-3">Quick Multi-Page Test</h4>
          <div className="flex space-x-3">
            <button
              onClick={() => handlePageChange(1)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Test Page 1
            </button>
            <button
              onClick={() => handlePageChange(2)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Test Page 2
            </button>
            <button
              onClick={() => handlePageChange(3)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Test Page 3
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold flex items-center">
            <AlertCircle className="mr-2"/>
            API Error
          </p>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Fetching data from DGCP API...</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                API Response Data - Page {currentPage}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {data.length} of {totalReleases.toLocaleString()} total releases
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {data.map((release, index) => (
                <div key={release.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {release.tender?.status || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          OCID: {release.ocid || 'N/A'}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {release.tender?.title || 'No title available'}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {release.tender?.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-48">
                            {release.buyer?.name || 'Unknown entity'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {release.tender?.tenderPeriod?.endDate ? 
                              formatDate(release.tender.tenderPeriod.endDate) : 
                              'No deadline'
                            }
                          </span>
                        </div>
                        {release.tender?.documents && release.tender.documents.length > 0 && (
                          <div className="flex items-center text-blue-600">
                            <FileText className="h-4 w-4 mr-1" />
                            <span>{release.tender.documents.length} docs</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-green-600">
                        {release.tender?.value?.amount ? 
                          formatCurrency(release.tender.value.amount, release.tender.value.currency || 'DOP') : 
                          'No budget'
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {release.tender?.procurementMethod || 'Unknown method'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Toggle */}
          <details className="bg-gray-900 text-white rounded-lg">
            <summary className="p-4 cursor-pointer hover:bg-gray-800 transition-colors">
              <span className="text-lg font-semibold">View Raw API Response (JSON)</span>
            </summary>
            <pre className="p-4 overflow-x-auto text-sm">
              {JSON.stringify({ 
                pagination: { currentPage, totalPages, totalReleases, releasesOnPage: data.length },
                releases: data 
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
          <p className="text-gray-500">
            No procurement releases found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
};