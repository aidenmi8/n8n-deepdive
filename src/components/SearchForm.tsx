import React from 'react';
import { Search, Calendar, Building, MapPin, Tag, Loader2 } from 'lucide-react';
import { SearchFilters } from '../types/api';

interface SearchFormProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
  institutions: string[];
  provinces: string[];
  modalities: string[];
}

export const SearchForm: React.FC<SearchFormProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  loading,
  institutions,
  provinces,
  modalities,
}) => {
  const handleInputChange = (field: keyof (SearchFilters & { keyword?: string; institution?: string; province?: string; modality?: string }), value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  // Get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDateRange();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keyword Search */}
            <div className="lg:col-span-2">
              <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                Palabra clave
              </label>
              <div className="relative">
                <input
                  id="keyword"
                  type="text"
                  placeholder="ej., consultoría, construcción, tecnología..."
                  value={(filters as any).keyword || ''}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Institution */}
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                Entidad Compradora
              </label>
              <div className="relative">
                <select
                  id="institution"
                  value={(filters as any).institution || ''}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Todas las entidades</option>
                  {institutions.map(institution => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
                <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Province */}
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <div className="relative">
                <select
                  id="province"
                  value={(filters as any).province || ''}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Todas las provincias</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Modality */}
            <div>
              <label htmlFor="modality" className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad
              </label>
              <div className="relative">
                <select
                  id="modality"
                  value={(filters as any).modality || ''}
                  onChange={(e) => handleInputChange('modality', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Todas las modalidades</option>
                  {modalities.map(modality => (
                    <option key={modality} value={modality}>
                      {modality}
                    </option>
                  ))}
                </select>
                <Tag className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha desde
              </label>
              <div className="relative">
                <input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || defaultDates.from}
                  onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha hasta
              </label>
              <div className="relative">
                <input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || defaultDates.to}
                  onChange={(e) => handleInputChange('dateTo', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Buscando en Base de Datos...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Search className="h-5 w-5 mr-2" />
                    Buscar en Base de Datos
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};