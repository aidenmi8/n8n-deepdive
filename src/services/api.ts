import { DGCPApiResponse, OCDSApiResponse, ProcurementRelease, SearchFilters, OCDSReleasePackage } from '../types/api';

const API_BASE_URL = 'https://api.dgcp.gob.do/api';

class APIService {
  private async fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        ...options,
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión: No se puede conectar con el servidor de la DGCP. Verificar conexión a internet.');
      }
      throw new Error(error instanceof Error ? error.message : 'Error desconocido al conectar con la API');
    }
  }

  // Get all institutions/purchasing entities
  async getInstitutions(): Promise<string[]> {
    try {
      // First, get a few sample institutions from the uc endpoint
      const response = await this.fetchAPI<any>('/uc/Direcci%C3%B3n%20General%20de%20Contrataciones%20P%C3%BAblicas/1?limit=100');
      
      // For now, return common Dominican institutions
      // This should be replaced with actual API data when the full institutions endpoint is available
      return [
        'Dirección General de Contrataciones Públicas',
        'Ministerio de Educación',
        'Ministerio de Salud Pública',
        'Ministerio de Obras Públicas y Comunicaciones',
        'Ministerio de Agricultura',
        'Ministerio de Turismo',
        'Ministerio de Cultura',
        'Ministerio de Deportes',
        'Ministerio de la Juventud',
        'Ministerio de la Mujer',
        'Ministerio de Medio Ambiente',
        'Ministerio de Energía y Minas',
        'Ministerio de Industria y Comercio',
        'Ministerio de Trabajo',
        'Ministerio de Economía',
        'Ministerio de Hacienda',
        'Ministerio de la Presidencia',
        'Ministerio de Interior y Policía',
        'Ministerio de Defensa',
        'Ministerio de Relaciones Exteriores',
        'Ayuntamiento del Distrito Nacional',
        'Ayuntamiento de Santiago',
        'Ayuntamiento de San Pedro de Macorís',
        'Ayuntamiento de La Romana',
        'Ayuntamiento de Puerto Plata',
        'Hospital General Plaza de la Salud',
        'Hospital Robert Reid Cabral',
        'Instituto Dominicano de Seguros Sociales (IDSS)',
        'Servicio Nacional de Salud (SNS)',
        'Universidad Autónoma de Santo Domingo (UASD)',
        'Instituto Tecnológico de Santo Domingo (INTEC)',
        'Corporación Dominicana de Empresas Eléctricas Estatales (CDEEE)',
        'Empresa Distribuidora de Electricidad del Este (EDE Este)',
        'Empresa Distribuidora de Electricidad del Norte (EDE Norte)',
        'Empresa Distribuidora de Electricidad del Sur (EDE Sur)',
        'Corporación del Acueducto y Alcantarillado de Santo Domingo (CAASD)',
        'Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)',
        'Dirección General de Aduanas (DGA)',
        'Dirección General de Impuestos Internos (DGII)',
        'Banco Central de la República Dominicana',
        'Superintendencia de Bancos',
        'Junta Central Electoral (JCE)',
        'Tribunal Superior Electoral (TSE)',
        'Consejo Nacional de la Magistratura',
        'Procuraduría General de la República'
      ].sort();
    } catch (error) {
      console.error('Error fetching institutions:', error);
      return [];
    }
  }

  // Get all provinces
  async getProvinces(): Promise<string[]> {
    try {
      // Return Dominican Republic provinces
      return [
        'Azua',
        'Bahoruco',
        'Barahona',
        'Dajabón',
        'Distrito Nacional',
        'Duarte',
        'El Seibo',
        'Elías Piña',
        'Espaillat',
        'Hato Mayor',
        'Hermanas Mirabal',
        'Independencia',
        'La Altagracia',
        'La Romana',
        'La Vega',
        'María Trinidad Sánchez',
        'Monseñor Nouel',
        'Monte Cristi',
        'Monte Plata',
        'Pedernales',
        'Peravia',
        'Puerto Plata',
        'Samaná',
        'San Cristóbal',
        'San José de Ocoa',
        'San Juan',
        'San Pedro de Macorís',
        'Sánchez Ramírez',
        'Santiago',
        'Santiago Rodríguez',
        'Santo Domingo',
        'Valverde'
      ].sort();
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  }

  // Get all modalities
  async getModalities(): Promise<string[]> {
    try {
      // Return common procurement modalities in Dominican Republic
      return [
        'Licitación Pública',
        'Licitación Restringida',
        'Comparación de Precios',
        'Subasta Inversa',
        'Contratación Menor',
        'Contratación Directa',
        'Sorteo de Obras',
        'Concurso',
        'Procedimiento Especial',
        'Emergencia',
        'Convenio Marco',
        'Procedimiento Dinámico'
      ].sort();
    } catch (error) {
      console.error('Error fetching modalities:', error);
      return [];
    }
  }
  // Get releases by date range
  async getReleasesByDate(filters: SearchFilters): Promise<DGCPApiResponse> {
    const page = filters.page || 1;
    
    // Ensure we have valid dates
    const dateFrom = filters.dateFrom || this.getDefaultDateRange().from;
    const dateTo = filters.dateTo || this.getDefaultDateRange().to;
    
    console.log(`Fetching releases from ${dateFrom} to ${dateTo}, page ${page}`);
    const endpoint = `/date/${dateFrom}/${dateTo}/${page}?limit=100`;
    
    const rawResponse = await this.fetchAPI<OCDSApiResponse>(endpoint);
    console.log('=== RAW OCDS API RESPONSE ===');
    console.log('Response keys:', Object.keys(rawResponse));
    console.log('Response structure:', JSON.stringify(rawResponse, null, 2));
    
    // Log the structure of the first release to understand the OCDS format
    if (rawResponse.data && rawResponse.data.length > 0) {
      console.log('=== FIRST RELEASE ANALYSIS ===');
      const firstRelease = rawResponse.data[0];
      console.log('First release type:', typeof firstRelease);
      console.log('First release keys:', Object.keys(firstRelease));
      console.log('First release full:', JSON.stringify(firstRelease, null, 2));
      
      // Check if it's nested in a releases property
      if (firstRelease.releases) {
        console.log('Found nested releases property:', firstRelease.releases);
      }
    }
    
    // Extract releases from nested data structure
    let releases = [];
    
    if (Array.isArray(rawResponse.data)) {
      releases = rawResponse.data;
    } else if (rawResponse.data && Array.isArray(rawResponse.data.releases)) {
      releases = rawResponse.data.releases;
    } else if (Array.isArray(rawResponse.releases)) {
      releases = rawResponse.releases;
    } else {
      console.error('Could not find releases array in response');
      console.error('Available properties:', Object.keys(rawResponse));
    }
    
    console.log(`Found ${releases.length} releases to process`);
    
    if (!Array.isArray(releases)) {
      console.error("Expected 'releases' to be an array:", releases);
      console.error("Full raw response:", rawResponse);
      return {
        releases: [],
        pagination: {
          page: page,
          totalPages: 1,
          totalReleases: 0,
          releasesPerPage: 100
        }
      };
    }
    
    // Get detailed information for each release using individual API calls
    console.log(`Fetching detailed data for ${releases.length} releases...`);
    const detailedReleases = await Promise.all(
      releases.slice(0, 20).map(async (release) => { // Limit to first 20 to avoid too many API calls
        try {
          const ocid = release.ocid || release.id;
          if (!ocid) {
            console.warn('Release without OCID:', release);
            return this.transformReleaseData(release);
          }
          
          console.log(`Fetching detailed data for OCID: ${ocid}`);
          const detailedRelease = await this.fetchAPI<any>(`/release/${ocid}`);
          console.log(`Detailed data for ${ocid}:`, detailedRelease);
          
          return this.transformReleaseData(detailedRelease);
        } catch (error) {
          console.warn(`Failed to fetch detailed data for release:`, error);
          // Fallback to basic release data
          return this.transformReleaseData(release);
        }
      })
    );
    
    console.log(`Successfully fetched detailed data for ${detailedReleases.length} releases`);
    console.log('First detailed release:', detailedReleases[0]);
    
    return {
      releases: detailedReleases,
      pagination: {
        page: rawResponse.pagination?.page || page,
        totalPages: rawResponse.pagination?.totalPages || Math.ceil(releases.length / 100),
        totalReleases: rawResponse.pagination?.totalReleases || releases.length,
        releasesPerPage: rawResponse.pagination?.releasesPerPage || 100
      }
    };
  }

  // Transform raw API data to match our expected structure
  private transformReleaseData(rawRelease: any): ProcurementRelease {
    console.log('=== RAW RELEASE DATA ANALYSIS ===');
    console.log('Full raw release:', JSON.stringify(rawRelease, null, 2));
    
    // Handle nested release structure - check if it's wrapped in a release package
    let actualRelease = rawRelease;
    
    // If it's a release package with nested releases, extract the first one
    if (rawRelease.releases && Array.isArray(rawRelease.releases) && rawRelease.releases.length > 0) {
      actualRelease = rawRelease.releases[0];
      console.log('Found nested release structure, using first release');
    }
    
    console.log('Working with release:', {
      keys: Object.keys(actualRelease),
      ocid: actualRelease.ocid,
      hasRelease: !!actualRelease.release,
      hasTender: !!actualRelease.tender,
      hasBuyer: !!actualRelease.buyer,
      hasParties: !!actualRelease.parties
    });
    
    // Try multiple paths for title extraction
    const extractedTitle = actualRelease.tender?.title ||
                          actualRelease.release?.tender?.title ||
                          actualRelease.title ||
                          'Título no disponible';
    
    const extractedDescription = actualRelease.tender?.description ||
                                actualRelease.release?.tender?.description ||
                                actualRelease.description ||
                                'Descripción no disponible';
    
    // Try multiple paths for buyer extraction
    const extractedBuyerName = actualRelease.buyer?.name ||
                              actualRelease.release?.buyer?.name ||
                              actualRelease.tender?.procuringEntity?.name ||
                              actualRelease.release?.tender?.procuringEntity?.name ||
                              actualRelease.parties?.find((p: any) => p.roles?.includes('buyer'))?.name ||
                              actualRelease.release?.parties?.find((p: any) => p.roles?.includes('buyer'))?.name ||
                              'Entidad no especificada';
    
    const extractedStatus = actualRelease.tender?.status ||
                           actualRelease.release?.tender?.status ||
                           'unknown';
    
    const extractedProcurementMethod = actualRelease.tender?.procurementMethodDetails ||
                                      actualRelease.release?.tender?.procurementMethodDetails ||
                                      actualRelease.tender?.procurementMethod ||
                                      actualRelease.release?.tender?.procurementMethod ||
                                      'No especificado';
    
    const extractedBudgetAmount = actualRelease.tender?.value?.amount ||
                                 actualRelease.release?.tender?.value?.amount ||
                                 actualRelease.planning?.budget?.amount?.amount ||
                                 actualRelease.release?.planning?.budget?.amount?.amount ||
                                 0;
    
    const extractedBudgetCurrency = actualRelease.tender?.value?.currency ||
                                   actualRelease.release?.tender?.value?.currency ||
                                   actualRelease.planning?.budget?.amount?.currency ||
                                   actualRelease.release?.planning?.budget?.amount?.currency ||
                                   'DOP';
    
    const extractedStartDate = actualRelease.tender?.tenderPeriod?.startDate ||
                              actualRelease.release?.tender?.tenderPeriod?.startDate ||
                              actualRelease.date ||
                              '';
    
    const extractedEndDate = actualRelease.tender?.tenderPeriod?.endDate ||
                            actualRelease.release?.tender?.tenderPeriod?.endDate ||
                            '';
    
    const workingParties = actualRelease.parties || actualRelease.release?.parties || [];
    const workingDocuments = actualRelease.tender?.documents || actualRelease.release?.tender?.documents || [];
    
    console.log('=== EXTRACTION RESULTS ===');
    console.log('Title:', extractedTitle);
    console.log('Buyer:', extractedBuyerName);
    console.log('Status:', extractedStatus);
    console.log('Method:', extractedProcurementMethod);
    console.log('Budget:', extractedBudgetAmount, extractedBudgetCurrency);
    console.log('Parties count:', workingParties.length);
    console.log('Documents count:', workingDocuments.length);
    
    return {
      id: actualRelease.id || actualRelease.release?.id || '',
      ocid: actualRelease.ocid || actualRelease.release?.ocid || '',
      date: actualRelease.date || actualRelease.release?.date || '',
      tag: actualRelease.tag || actualRelease.release?.tag || [],
      initiationType: actualRelease.initiationType || actualRelease.release?.initiationType || '',
      parties: workingParties.map((party: any) => ({
        id: party.id || '',
        name: party.name || 'Unnamed party',
        identifier: party.identifier || { scheme: '', id: '', legalName: '' },
        address: {
          locality: party.address?.locality || '',
          region: party.address?.region || party.address?.locality || 'No especificado',
          countryName: party.address?.countryName || 'Dominican Republic'
        },
        contactPoint: party.contactPoint || { name: '', email: '', telephone: '' },
        roles: party.roles || []
      })),
      buyer: {
        id: actualRelease.buyer?.id || actualRelease.release?.buyer?.id || '',
        name: extractedBuyerName
      },
      planning: actualRelease.planning || actualRelease.release?.planning || {
        budget: {
          amount: { amount: 0, currency: 'DOP' },
          description: ''
        },
        rationale: ''
      },
      tender: {
        id: actualRelease.tender?.id || actualRelease.release?.tender?.id || '',
        title: extractedTitle,
        description: extractedDescription,
        status: extractedStatus,
        procurementMethod: extractedProcurementMethod,
        procurementMethodDetails: actualRelease.tender?.procurementMethodDetails || 
                                 actualRelease.release?.tender?.procurementMethodDetails || '',
        mainProcurementCategory: actualRelease.tender?.mainProcurementCategory || 
                                actualRelease.release?.tender?.mainProcurementCategory || 'No especificado',
        submissionMethod: actualRelease.tender?.submissionMethod || 
                         actualRelease.release?.tender?.submissionMethod || [],
        submissionMethodDetails: actualRelease.tender?.submissionMethodDetails || 
                                actualRelease.release?.tender?.submissionMethodDetails || '',
        tenderPeriod: {
          startDate: extractedStartDate,
          endDate: extractedEndDate
        },
        enquiryPeriod: {
          startDate: actualRelease.tender?.enquiryPeriod?.startDate || actualRelease.release?.tender?.enquiryPeriod?.startDate || '',
          endDate: actualRelease.tender?.enquiryPeriod?.endDate || actualRelease.release?.tender?.enquiryPeriod?.endDate || ''
        },
        hasEnquiries: actualRelease.tender?.hasEnquiries || actualRelease.release?.tender?.hasEnquiries || false,
        eligibilityCriteria: actualRelease.tender?.eligibilityCriteria || actualRelease.release?.tender?.eligibilityCriteria || '',
        awardCriteria: actualRelease.tender?.awardCriteria || actualRelease.release?.tender?.awardCriteria || '',
        awardCriteriaDetails: actualRelease.tender?.awardCriteriaDetails || actualRelease.release?.tender?.awardCriteriaDetails || '',
        value: {
          amount: extractedBudgetAmount,
          currency: extractedBudgetCurrency
        },
        documents: workingDocuments.map((doc: any) => ({
          id: doc.id || '',
          documentType: doc.documentType || 'Unknown type',
          title: doc.title || 'Untitled document',
          description: doc.description || '',
          url: doc.url || '',
          datePublished: doc.datePublished || '',
          dateModified: doc.dateModified || '',
          format: doc.format || '',
          language: doc.language || 'es'
        }))
      },
      awards: actualRelease.awards || actualRelease.release?.awards || [],
      contracts: actualRelease.contracts || actualRelease.release?.contracts || [],
      language: actualRelease.language || actualRelease.release?.language || 'es',
      publishedDate: actualRelease.publishedDate || actualRelease.release?.publishedDate || actualRelease.date || ''
    };
  }

  // Helper method to get default date range
  private getDefaultDateRange() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  }
  // Get release details by ID
  async getReleaseDetails(id: string): Promise<ProcurementRelease> {
    if (!id || id.trim() === '') {
      throw new Error('Release ID is required');
    }
    return this.fetchAPI<ProcurementRelease>(`/release/${id}`);
  }

  // Helper method to get current releases (last 30 days)
  async getCurrentReleases(page: number = 1): Promise<DGCPApiResponse> {
    const defaultDates = this.getDefaultDateRange();
    
    return this.getReleasesByDate({ 
      dateFrom: defaultDates.from, 
      dateTo: defaultDates.to, 
      page 
    });
  }

  // Helper method to search releases with text filter
  async searchReleases(filters: SearchFilters & { keyword?: string }): Promise<DGCPApiResponse> {
    console.log('Searching with filters:', filters);
    
    let response: DGCPApiResponse;
    
    // If institution is specified, use the /uc/ endpoint
    if ((filters as any).institution) {
      console.log('Using UC endpoint for institution:', (filters as any).institution);
      const encodedInstitution = encodeURIComponent((filters as any).institution);
      const page = filters.page || 1;
      const endpoint = `/uc/${encodedInstitution}/${page}?limit=100`;
      
      try {
        const rawResponse = await this.fetchAPI<OCDSApiResponse>(endpoint);
        console.log('UC endpoint response:', rawResponse);
        
        // Extract releases from the response
        let releases = [];
        if (Array.isArray(rawResponse.data)) {
          releases = rawResponse.data;
        } else if (Array.isArray(rawResponse.releases)) {
          releases = rawResponse.releases;
        } else if (Array.isArray(rawResponse)) {
          releases = rawResponse;
        }
        
        console.log(`Found ${releases.length} releases from UC endpoint`);
        
        // Get detailed information for each release
        const detailedReleases = await Promise.all(
          releases.slice(0, 20).map(async (release) => {
            try {
              const ocid = release.ocid || release.id;
              if (!ocid) {
                return this.transformReleaseData(release);
              }
              
              const detailedRelease = await this.fetchAPI<any>(`/release/${ocid}`);
              return this.transformReleaseData(detailedRelease);
            } catch (error) {
              console.warn(`Failed to fetch detailed data for release:`, error);
              return this.transformReleaseData(release);
            }
          })
        );
        
        response = {
          releases: detailedReleases,
          pagination: {
            page: rawResponse.pagination?.page || page,
            totalPages: rawResponse.pagination?.totalPages || Math.ceil(releases.length / 100),
            totalReleases: rawResponse.pagination?.totalReleases || releases.length,
            releasesPerPage: rawResponse.pagination?.releasesPerPage || 100
          }
        };
      } catch (error) {
        console.error('Error with UC endpoint, falling back to date search:', error);
        response = await this.getReleasesByDate(filters);
      }
    } else {
      // Use date endpoint when no institution is specified
      console.log('Using date endpoint for general search');
      response = await this.getReleasesByDate(filters);
    }
    
    console.log('Search response:', response);
    
    if (filters.keyword && Array.isArray(response.releases)) {
      // Client-side filtering by keyword
      const keyword = filters.keyword.toLowerCase();
      const filteredReleases = response.releases.filter(release => 
        (release.tender?.title?.toLowerCase() || '').includes(keyword) ||
        (release.tender?.description?.toLowerCase() || '').includes(keyword) ||
        (release.buyer?.name?.toLowerCase() || '').includes(keyword)
      );
      
      console.log(`Filtered from ${response.releases.length} to ${filteredReleases.length} releases with keyword: ${filters.keyword}`);
      
      return {
        ...response,
        releases: filteredReleases,
        pagination: {
          ...response.pagination,
          totalReleases: filteredReleases.length
        }
      };
    }
    
    // Apply date filtering if we used UC endpoint
    if ((filters as any).institution && (filters.dateFrom || filters.dateTo)) {
      console.log('Applying date filtering to UC results');
      const dateFrom = filters.dateFrom || this.getDefaultDateRange().from;
      const dateTo = filters.dateTo || this.getDefaultDateRange().to;
      
      const filteredByDate = response.releases.filter(release => {
        const releaseDate = release.date || release.publishedDate;
        if (!releaseDate) return true; // Include if no date available
        
        const releaseDateStr = new Date(releaseDate).toISOString().split('T')[0];
        return releaseDateStr >= dateFrom && releaseDateStr <= dateTo;
      });
      
      console.log(`Date filtered from ${response.releases.length} to ${filteredByDate.length} releases`);
      
      return {
        ...response,
        releases: filteredByDate,
        pagination: {
          ...response.pagination,
          totalReleases: filteredByDate.length
        }
      };
    }
    
    return response;
  }

  // Get unique values for filters
  getUniqueInstitutions(releases: ProcurementRelease[]): string[] {
    if (!Array.isArray(releases)) {
      return [];
    }
    const institutions = new Set(
      releases
        .map(r => r.buyer?.name)
        .filter((name): name is string => typeof name === 'string')
    );
    return Array.from(institutions).sort();
  }
  
  getUniqueProvinces(releases: ProcurementRelease[]): string[] {
    if (!Array.isArray(releases)) {
      return [];
    }
    const provinces = new Set(
      releases
        .map(r => r.parties?.find(p => p.roles?.includes('buyer'))?.address?.region || 'No especificado')
        .filter((province): province is string => typeof province === 'string')
    );
    return Array.from(provinces).sort();
  }
  
  getUniqueModalities(releases: ProcurementRelease[]): string[] {
    if (!Array.isArray(releases)) {
      return [];
    }
    const modalities = new Set(
      releases
        .map(r => r.tender?.procurementMethod)
        .filter((modality): modality is string => typeof modality === 'string')
    );
    return Array.from(modalities).sort();
  }
}

export const apiService = new APIService();