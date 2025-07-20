// API Types for Dominican Republic Government Procurement Portal
export interface OCDSApiResponse {
  data: ProcurementRelease[];
  pagination: {
    page: number;
    totalPages: number;
    totalReleases: number;
    releasesPerPage: number;
  };
}

export interface DGCPApiResponse {
  releases: ProcurementRelease[];
  pagination: {
    page: number;
    totalPages: number;
    totalReleases: number;
    releasesPerPage: number;
  };
}

// OCDS 1.0.0 Standard Release Package
export interface OCDSReleasePackage {
  releases: ProcurementRelease[];
  publisher?: any;
  publishedDate?: string;
}

export interface ProcurementRelease {
  id: string;
  ocid: string;
  date: string;
  tag: string[];
  initiationType: string;
  parties: Party[];
  buyer: Buyer;
  planning: Planning;
  tender: Tender;
  awards?: Award[];
  contracts?: Contract[];
  language: string;
  publishedDate: string;
}

export interface Party {
  id: string;
  name: string;
  identifier: {
    scheme: string;
    id: string;
    legalName: string;
  };
  address: {
    locality: string;
    region: string;
    countryName: string;
  };
  contactPoint: {
    name: string;
    email: string;
    telephone: string;
  };
  roles: string[];
}

export interface Buyer {
  id: string;
  name: string;
}

export interface Planning {
  budget: {
    amount: {
      amount: number;
      currency: string;
    };
    description: string;
  };
  rationale: string;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  status: string;
  procurementMethod: string;
  procurementMethodDetails: string;
  mainProcurementCategory: string;
  submissionMethod: string[];
  submissionMethodDetails: string;
  tenderPeriod: {
    startDate: string;
    endDate: string;
  };
  enquiryPeriod: {
    startDate: string;
    endDate: string;
  };
  hasEnquiries: boolean;
  eligibilityCriteria: string;
  awardCriteria: string;
  awardCriteriaDetails: string;
  value: {
    amount: number;
    currency: string;
  };
  documents: TenderDocument[];
}

export interface TenderDocument {
  id: string;
  documentType: string;
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  format: string;
  language: string;
}

export interface Award {
  id: string;
  title: string;
  description: string;
  status: string;
  date: string;
  value: {
    amount: number;
    currency: string;
  };
  suppliers: Party[];
  contractPeriod: {
    startDate: string;
    endDate: string;
  };
}

export interface Contract {
  id: string;
  awardID: string;
  title: string;
  description: string;
  status: string;
  period: {
    startDate: string;
    endDate: string;
  };
  value: {
    amount: number;
    currency: string;
  };
}

export interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  page?: number;
}

// New interfaces for filter data
export interface Institution {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  name: string;
}

export interface Modality {
  id: string;
  name: string;
}