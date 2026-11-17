/**
 * NILMA VA Real Estate — Database & Entity Type Definitions
 * Matches PostgreSQL production schema exactly
 */

export type UserRole =
  | 'platform_super_admin'
  | 'agency_principal'
  | 'senior_broker'
  | 'transaction_coordinator';

export type ClientType = 'Buyer' | 'Seller' | 'Investor' | 'Tenant';
export type PropertyType = 'Villa' | 'Penthouse' | 'Apartment' | 'Townhouse' | 'Commercial' | 'Land';
export type PropertyStatus = 'Available' | 'Under Offer' | 'Sold' | 'Off Market';
export type LeadSource = 'Website' | 'Portal' | 'Referral' | 'Walk-in' | 'Social' | 'Sign Call';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Viewing Scheduled' | 'Negotiation' | 'Closed Won' | 'Lost';
export type PipelineStage =
  | 'new_enquiry'
  | 'contacted'
  | 'qualified'
  | 'viewing_scheduled'
  | 'negotiation'
  | 'offer_accepted'
  | 'closed_won'
  | 'closed_lost';

export type ViewingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type MeasurementUnit = 'sqm' | 'sqft';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_entity_name: string;
  currency: string;
  default_measurement_unit: MeasurementUnit;
  default_commission_rate: number;
  agency_split_pct: number;
  agent_split_pct: number;
  annual_sales_target: number;
  annual_profit_target: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  organization_id: string;
  member_id?: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  annual_quota: number;
  commission_split_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  client_type: ClientType;
  email: string;
  phone?: string;
  preferred_location?: string;
  budget?: number;
  assigned_agent_id?: string;
  status: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  ref_code: string;
  title: string;
  property_type: PropertyType;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number; // Canonical size in Square Metres
  entry_measurement_unit: MeasurementUnit;
  image_url?: string;
  google_drive_folder_url?: string;
  status: PropertyStatus;
  assigned_agent_id?: string;
  date_listed: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  lead_type: string;
  status: LeadStatus;
  assigned_agent_id?: string;
  budget_min?: number;
  budget_max?: number;
  property_interest?: string;
  timeline?: string;
  is_preapproved: boolean;
  heat_score: number; // 0 - 100
  last_contact_date?: string;
  next_followup_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  title: string;
  property_id?: string;
  client_id?: string;
  assigned_agent_id: string;
  stage: PipelineStage;
  deal_value: number;
  probability_pct: number;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Viewing {
  id: string;
  organization_id: string;
  property_id: string;
  property_title?: string;
  client_id?: string;
  client_name?: string;
  assigned_agent_id: string;
  viewing_date: string;
  viewing_time: string;
  status: ViewingStatus;
  rating: number; // 0 - 5
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  due_date: string;
  priority: TaskPriority;
  assigned_agent_id?: string;
  linked_property_id?: string;
  linked_lead_id?: string;
  linked_deal_id?: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  settlement_reference: string;
  property_id?: string;
  property_title_snapshot: string;
  client_id?: string;
  client_name_snapshot?: string;
  agent_id: string;
  agent_name_snapshot: string;
  closing_date: string;
  sale_price: number;
  commission_rate: number;
  agency_split_pct: number;
  agent_split_pct: number;
  gross_commission: number;
  agency_share: number;
  agent_share: number;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  date: string;
  description: string;
  category: string;
  recurrence: string;
  amount: number;
  vendor?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  category: string;
  action: string;
  details: string;
  user_identifier: string;
  created_at: string;
}

export interface FinancialSummary {
  gross_sales: number;
  gross_commission: number;
  agency_retained: number;
  agent_payouts: number;
  operating_expenses: number;
  net_operating_profit: number;
  net_profit_margin_pct: number;
}

export type OfferStatus = 'Submitted' | 'Countered' | 'Accepted' | 'Rejected' | 'Withdrawn';
export type FinancingType = 'Cash' | 'Conventional' | 'Jumbo' | 'Private Equity' | 'Seller Financing';

export interface Offer {
  id: string;
  organization_id: string;
  property_id: string;
  property_title: string;
  client_id?: string;
  client_name: string;
  assigned_agent_id: string;
  offer_amount: number;
  asking_price: number;
  earnest_money?: number;
  financing_type: FinancingType;
  expiration_date: string;
  proposed_closing_date: string;
  status: OfferStatus;
  counter_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OpenHouseStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface OpenHouse {
  id: string;
  organization_id: string;
  property_id: string;
  property_title: string;
  host_agent_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  visitor_count: number;
  leads_captured: number;
  status: OpenHouseStatus;
  refreshments_notes?: string;
  feedback_summary?: string;
  created_at: string;
  updated_at: string;
}

export type ListingStage =
  | 'new_opportunity'
  | 'valuation_pitch'
  | 'agreement_signed'
  | 'staging_media'
  | 'active_listing'
  | 'under_contract'
  | 'closed_sold'
  | 'withdrawn';

export interface ListingOpportunity {
  id: string;
  organization_id: string;
  title: string;
  property_id?: string;
  seller_client_id: string;
  seller_name: string;
  assigned_agent_id: string;
  target_price: number;
  stage: ListingStage;
  valuation_estimate: number;
  commission_rate: number;
  exclusive_period_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type NavigationGroup = 'OVERVIEW' | 'CLIENTS' | 'PROPERTIES' | 'SALES' | 'BUSINESS';

export type NavigationSection =
  | 'dashboard'
  | 'today'
  | 'calendar'
  | 'tasks'
  | 'leads'
  | 'pipeline'
  | 'contacts'
  | 'buyers'
  | 'sellers'
  | 'renters'
  | 'pastclients'
  | 'properties'
  | 'listings'
  | 'listingpipe'
  | 'showings'
  | 'openhouses'
  | 'offers'
  | 'deals'
  | 'money'
  | 'analytics'
  | 'settings';

