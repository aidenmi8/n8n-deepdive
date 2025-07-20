import { createClient } from '@supabase/supabase-js';
import { ProcurementRelease } from '../types/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" in the top right.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseRelease {
  id: string;
  ocid: string;
  title: string | null;
  description: string | null;
  status: string | null;
  procurement_method: string | null;
  procurement_method_details: string | null;
  main_procurement_category: string | null;
  submission_method: string[] | null;
  budget_amount: number | null;
  budget_currency: string | null;
  start_date: string | null;
  end_date: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  published_date: string | null;
  tender_period_start: string | null;
  tender_period_end: string | null;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export interface DatabaseParty {
  id: string;
  release_id: string;
  party_id: string;
  name: string;
  roles: string[];
  address_region: string | null;
  address_locality: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
}

export interface DatabaseDocument {
  id: string;
  release_id: string;
  document_id: string | null;
  document_type: string | null;
  title: string | null;
  description: string | null;
  url: string | null;
  format: string | null;
  date_published: string | null;
}

export interface SearchFilters {
  keyword?: string;
  entities?: string[];
  regions?: string[];
  categories?: string[];
  methods?: string[];
  status?: string[];
  minBudget?: number;
  maxBudget?: number;
  startDate?: string;
  endDate?: string;
  hasDocuments?: boolean;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserAlert {
  id: string;
  user_id: string;
  name: string;
  keywords: string[] | null;
  entities: string[] | null;
  regions: string[] | null;
  categories: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  is_active: boolean;
  email_frequency: string;
}

export interface UserBookmark {
  id: string;
  user_id: string;
  release_id: string;
  tags: string[] | null;
  created_at: string;
}

export interface UserNote {
  id: string;
  user_id: string;
  release_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  // Store procurement release data
  async storeProcurementRelease(release: ProcurementRelease): Promise<DatabaseRelease | null> {
    try {
      const { data, error } = await supabase
        .from('procurement_releases')
        .upsert({
          ocid: release.ocid,
          title: release.tender?.title || null,
          description: release.tender?.description || null,
          status: release.tender?.status || null,
          procurement_method: release.tender?.procurementMethod || null,
          procurement_method_details: release.tender?.procurementMethodDetails || null,
          main_procurement_category: release.tender?.mainProcurementCategory || null,
          submission_method: release.tender?.submissionMethod || null,
          budget_amount: release.tender?.value?.amount || null,
          budget_currency: release.tender?.value?.currency || 'DOP',
          start_date: release.tender?.tenderPeriod?.startDate || null,
          end_date: release.tender?.tenderPeriod?.endDate || null,
          buyer_id: release.buyer?.id || null,
          buyer_name: release.buyer?.name || null,
          published_date: release.publishedDate || null,
          tender_period_start: release.tender?.tenderPeriod?.startDate || null,
          tender_period_end: release.tender?.tenderPeriod?.endDate || null,
          raw_data: release,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ocid'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing procurement release:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error storing release:', error);
      return null;
    }
  }

  // Store related parties
  async storeProcurementParties(releaseId: string, parties: any[]): Promise<void> {
    try {
      const partyData = parties.map(party => ({
        release_id: releaseId,
        party_id: party.id || '',
        name: party.name || '',
        roles: party.roles || [],
        address_region: party.address?.region || null,
        address_locality: party.address?.locality || null,
        contact_email: party.contactPoint?.email || null,
        contact_telephone: party.contactPoint?.telephone || null
      }));

      const { error } = await supabase
        .from('procurement_parties')
        .upsert(partyData, {
          onConflict: 'release_id,party_id'
        });

      if (error) {
        console.error('Error storing procurement parties:', error);
      }
    } catch (error) {
      console.error('Database error storing parties:', error);
    }
  }

  // Store documents
  async storeProcurementDocuments(releaseId: string, documents: any[]): Promise<void> {
    try {
      const documentData = documents.map(doc => ({
        release_id: releaseId,
        document_id: doc.id || null,
        document_type: doc.documentType || null,
        title: doc.title || null,
        description: doc.description || null,
        url: doc.url || null,
        format: doc.format || null,
        date_published: doc.datePublished || null
      }));

      const { error } = await supabase
        .from('procurement_documents')
        .upsert(documentData, {
          onConflict: 'release_id,document_id'
        });

      if (error) {
        console.error('Error storing procurement documents:', error);
      }
    } catch (error) {
      console.error('Database error storing documents:', error);
    }
  }

  // Search releases with filters
  async searchReleases(filters: SearchFilters): Promise<{
    releases: DatabaseRelease[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let query = supabase
        .from('procurement_releases')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.keyword) {
        // Use a more flexible search approach
        const searchTerm = `%${filters.keyword.toLowerCase()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},buyer_name.ilike.${searchTerm}`);
        
        // Alternative: you can also try the full-text search if the above doesn't work well
        // query = query.textSearch('title,description,buyer_name', filters.keyword, {
          // type: 'websearch',
          // config: 'spanish'
        // });
      }

      if (filters.entities && filters.entities.length > 0) {
        query = query.in('buyer_name', filters.entities);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('main_procurement_category', filters.categories);
      }

      if (filters.methods && filters.methods.length > 0) {
        query = query.in('procurement_method', filters.methods);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.minBudget !== undefined) {
        query = query.gte('budget_amount', filters.minBudget);
      }

      if (filters.maxBudget !== undefined) {
        query = query.lte('budget_amount', filters.maxBudget);
      }

      if (filters.startDate) {
        // Handle both published_date and created_at for date filtering
        query = query.or(`published_date.gte.${filters.startDate},created_at.gte.${filters.startDate}`);
      }

      if (filters.endDate) {
        // Add one day to end date to include the entire end date
        const endDatePlusOne = new Date(filters.endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        const endDateString = endDatePlusOne.toISOString().split('T')[0];
        query = query.or(`published_date.lt.${endDateString},created_at.lt.${endDateString}`);
      }

      if (filters.isActive) {
        query = query.eq('status', 'active');
      }

      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const offset = (page - 1) * pageSize;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error searching releases:', error);
        return { releases: [], total: 0, page: 1, totalPages: 0 };
      }

      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        releases: data || [],
        total: count || 0,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Database error searching releases:', error);
      return { releases: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  // Get unique filter options
  async getFilterOptions(): Promise<{
    entities: string[];
    regions: string[];
    categories: string[];
    methods: string[];
  }> {
    try {
      const [entitiesResult, regionsResult, categoriesResult, methodsResult] = await Promise.all([
        supabase
          .from('procurement_releases')
          .select('buyer_name')
          .not('buyer_name', 'is', null)
          .order('buyer_name'),
        
        supabase
          .from('procurement_parties')
          .select('address_region')
          .not('address_region', 'is', null)
          .order('address_region'),
        
        supabase
          .from('procurement_releases')
          .select('main_procurement_category')
          .not('main_procurement_category', 'is', null)
          .order('main_procurement_category'),
        
        supabase
          .from('procurement_releases')
          .select('procurement_method')
          .not('procurement_method', 'is', null)
          .order('procurement_method')
      ]);

      return {
        entities: [...new Set(entitiesResult.data?.map(r => r.buyer_name) || [])],
        regions: [...new Set(regionsResult.data?.map(r => r.address_region) || [])],
        categories: [...new Set(categoriesResult.data?.map(r => r.main_procurement_category) || [])],
        methods: [...new Set(methodsResult.data?.map(r => r.procurement_method) || [])]
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return { entities: [], regions: [], categories: [], methods: [] };
    }
  }

  // User management methods
  async createUserProfile(userId: string, profile: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Database error creating profile:', error);
    }
  }

  async createUserAlert(userId: string, alert: Omit<UserAlert, 'id' | 'user_id'>): Promise<UserAlert | null> {
    try {
      const { data, error } = await supabase
        .from('user_alerts')
        .insert({
          user_id: userId,
          ...alert
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user alert:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error creating alert:', error);
      return null;
    }
  }

  async getUserAlerts(userId: string): Promise<UserAlert[]> {
    try {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error getting alerts:', error);
      return [];
    }
  }

  async bookmarkRelease(userId: string, releaseId: string, tags?: string[]): Promise<UserBookmark | null> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .upsert({
          user_id: userId,
          release_id: releaseId,
          tags: tags || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error bookmarking release:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error bookmarking release:', error);
      return null;
    }
  }

  async getUserBookmarks(userId: string): Promise<UserBookmark[]> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(`
          *,
          procurement_releases (
            title,
            buyer_name,
            end_date,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user bookmarks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error getting bookmarks:', error);
      return [];
    }
  }

  async addUserNote(userId: string, releaseId: string, content: string): Promise<UserNote | null> {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert({
          user_id: userId,
          release_id: releaseId,
          content
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding user note:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error adding note:', error);
      return null;
    }
  }

  // Analytics methods
  async getVendorPerformance(vendorName?: string, entityName?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('vendor_performance')
        .select('*')
        .order('total_value', { ascending: false });

      if (vendorName) {
        query = query.eq('vendor_name', vendorName);
      }

      if (entityName) {
        query = query.eq('entity_name', entityName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting vendor performance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error getting vendor performance:', error);
      return [];
    }
  }

  async getPricingIntelligence(category?: string, entityName?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('pricing_intelligence')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (entityName) {
        query = query.eq('entity_name', entityName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting pricing intelligence:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error getting pricing intelligence:', error);
      return [];
    }
  }
}

export const databaseService = new DatabaseService();