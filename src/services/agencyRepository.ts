/**
 * NILMA VA Real Estate — Dual-Engine Agency Repository
 * Implements clean repository pattern:
 * - LocalStorageAdapter (zero-config demo persistence)
 * - SupabaseAdapter (production cloud persistence with PostgreSQL RLS)
 */

import {
  Organization,
  Agent,
  Property,
  Lead,
  Deal,
  Client,
  Viewing,
  Task,
  Transaction,
  Expense,
  AuditLog,
  FinancialSummary,
  PipelineStage,
  Offer,
  OpenHouse,
  ListingOpportunity,
  ListingStage,
} from '../types/database';
import {
  INITIAL_ORGANIZATION,
  INITIAL_AGENTS,
  INITIAL_PROPERTIES,
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_CLIENTS,
  INITIAL_VIEWINGS,
  INITIAL_TASKS,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_OFFERS,
  INITIAL_OPEN_HOUSES,
  INITIAL_LISTING_OPPORTUNITIES,
} from './mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'nilma_real_estate_db_v2';

interface DatabaseStore {
  organization: Organization;
  agents: Agent[];
  properties: Property[];
  leads: Lead[];
  deals: Deal[];
  clients: Client[];
  viewings: Viewing[];
  tasks: Task[];
  transactions: Transaction[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  offers: Offer[];
  openHouses: OpenHouse[];
  listingOpportunities: ListingOpportunity[];
}

class AgencyRepository {
  private isDemoMode: boolean;

  constructor() {
    this.isDemoMode = !isSupabaseConfigured || import.meta.env.VITE_DEMO_MODE === 'true';
    if (this.isDemoMode) {
      this.initLocalStore();
    }
  }

  private initLocalStore(): DatabaseStore {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.offers) parsed.offers = [...INITIAL_OFFERS];
        if (!parsed.openHouses) parsed.openHouses = [...INITIAL_OPEN_HOUSES];
        if (!parsed.listingOpportunities) parsed.listingOpportunities = [...INITIAL_LISTING_OPPORTUNITIES];
        return parsed;
      } catch (e) {
        console.error('Failed to parse local storage, reseeding default records', e);
      }
    }

    const defaultStore: DatabaseStore = {
      organization: { ...INITIAL_ORGANIZATION },
      agents: [...INITIAL_AGENTS],
      properties: [...INITIAL_PROPERTIES],
      leads: [...INITIAL_LEADS],
      deals: [...INITIAL_DEALS],
      clients: [...INITIAL_CLIENTS],
      viewings: [...INITIAL_VIEWINGS],
      tasks: [...INITIAL_TASKS],
      transactions: [...INITIAL_TRANSACTIONS],
      expenses: [...INITIAL_EXPENSES],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      offers: [...INITIAL_OFFERS],
      openHouses: [...INITIAL_OPEN_HOUSES],
      listingOpportunities: [...INITIAL_LISTING_OPPORTUNITIES],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
    return defaultStore;
  }

  private getStore(): DatabaseStore {
    return this.initLocalStore();
  }

  private saveStore(store: DatabaseStore): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  // ==========================================
  // ORGANIZATION / SETTINGS
  // ==========================================
  async getOrganization(): Promise<Organization> {
    if (this.isDemoMode) {
      return this.getStore().organization;
    }
    const { data, error } = await supabase!.from('organizations').select('*').single();
    if (error) throw error;
    return data;
  }

  async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
    if (this.isDemoMode) {
      const store = this.getStore();
      store.organization = {
        ...store.organization,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.saveStore(store);
      await this.logAudit(
        'System',
        'SETTINGS_UPDATED',
        `Agency settings updated: ${Object.keys(updates).join(', ')}`
      );
      return store.organization;
    }
    const { data, error } = await supabase!
      .from('organizations')
      .update(updates)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ==========================================
  // AGENTS
  // ==========================================
  async getAgents(): Promise<Agent[]> {
    if (this.isDemoMode) {
      return this.getStore().agents;
    }
    const { data, error } = await supabase!.from('agents').select('*').order('name');
    if (error) throw error;
    return data;
  }

  async saveAgent(agent: Partial<Agent> & { name: string; role: string; email: string }): Promise<Agent> {
    const store = this.getStore();
    const isNew = !agent.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newAgent: Agent = {
        id: `AGT-${String(store.agents.length + 1).padStart(2, '0')}`,
        organization_id: store.organization.id,
        name: agent.name,
        role: agent.role,
        email: agent.email,
        phone: agent.phone || '',
        avatar_url: agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        annual_quota: agent.annual_quota || 3000000,
        commission_split_rate: agent.commission_split_rate || 50.0,
        is_active: agent.is_active !== false,
        created_at: now,
        updated_at: now,
      };
      store.agents.push(newAgent);
      this.saveStore(store);
      await this.logAudit('Broker', 'BROKER_ADDED', `Added broker ${newAgent.name} (${newAgent.id})`);
      return newAgent;
    } else {
      const index = store.agents.findIndex((a) => a.id === agent.id);
      if (index === -1) throw new Error('Agent not found');
      store.agents[index] = {
        ...store.agents[index],
        ...agent,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Broker', 'BROKER_UPDATED', `Updated broker ${agent.name} (${agent.id})`);
      return store.agents[index];
    }
  }

  async deleteAgent(id: string): Promise<void> {
    const store = this.getStore();
    const agent = store.agents.find((a) => a.id === id);
    if (!agent) return;

    // Check historical dependencies
    const hasTransactions = store.transactions.some(
      (tx) => tx.agent_id === id || tx.agent_name_snapshot === agent.name
    );
    const hasDeals = store.deals.some((d) => d.assigned_agent_id === id);

    if (hasTransactions || hasDeals) {
      throw new Error(
        `Cannot delete broker "${agent.name}" because historical settlement records or active deals reference them. Deactivate instead to preserve financial audit compliance.`
      );
    }

    store.agents = store.agents.filter((a) => a.id !== id);
    this.saveStore(store);
    await this.logAudit('Broker', 'BROKER_DELETED', `Deleted broker ${agent.name} (${id})`);
  }

  async toggleAgentActive(id: string): Promise<Agent> {
    const store = this.getStore();
    const agent = store.agents.find((a) => a.id === id);
    if (!agent) throw new Error('Agent not found');
    agent.is_active = !agent.is_active;
    agent.updated_at = new Date().toISOString();
    this.saveStore(store);
    await this.logAudit(
      'Broker',
      'BROKER_STATUS_TOGGLED',
      `Toggled status for ${agent.name} to ${agent.is_active ? 'ACTIVE' : 'INACTIVE'}`
    );
    return agent;
  }

  // ==========================================
  // PROPERTIES
  // ==========================================
  async getProperties(): Promise<Property[]> {
    if (this.isDemoMode) {
      return this.getStore().properties;
    }
    const { data, error } = await supabase!.from('properties').select('*').order('date_listed', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveProperty(property: Partial<Property> & { title: string; price: number; size_sqm: number }): Promise<Property> {
    const store = this.getStore();
    const isNew = !property.id;
    const now = new Date().toISOString();

    if (isNew) {
      const refCode = `NVA-${Math.floor(1000 + Math.random() * 9000)}`;
      const newProp: Property = {
        id: `PROP-${100 + store.properties.length + 1}`,
        organization_id: store.organization.id,
        ref_code: refCode,
        title: property.title,
        property_type: property.property_type || 'Villa',
        location: property.location || 'Beverly Hills / Bel-Air',
        price: property.price,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        size_sqm: property.size_sqm,
        entry_measurement_unit: property.entry_measurement_unit || 'sqm',
        image_url: property.image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
        google_drive_folder_url: property.google_drive_folder_url || '',
        status: property.status || 'Available',
        assigned_agent_id: property.assigned_agent_id,
        date_listed: property.date_listed || now.split('T')[0],
        description: property.description || '',
        notes: property.notes || '',
        created_at: now,
        updated_at: now,
      };
      store.properties.unshift(newProp);
      this.saveStore(store);
      await this.logAudit('Listing', 'PROPERTY_LISTED', `Listed new property ${newProp.title} (${refCode})`);
      return newProp;
    } else {
      const index = store.properties.findIndex((p) => p.id === property.id);
      if (index === -1) throw new Error('Property not found');
      store.properties[index] = {
        ...store.properties[index],
        ...property,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Listing', 'PROPERTY_UPDATED', `Updated listing ${property.title} (${store.properties[index].ref_code})`);
      return store.properties[index];
    }
  }

  async deleteProperty(id: string): Promise<void> {
    const store = this.getStore();
    const prop = store.properties.find((p) => p.id === id);
    if (!prop) return;

    store.properties = store.properties.filter((p) => p.id !== id);
    this.saveStore(store);
    await this.logAudit('Listing', 'PROPERTY_REMOVED', `Removed listing ${prop.title} (${prop.ref_code})`);
  }

  // ==========================================
  // LEADS
  // ==========================================
  async getLeads(): Promise<Lead[]> {
    if (this.isDemoMode) {
      return this.getStore().leads;
    }
    const { data, error } = await supabase!.from('leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveLead(lead: Partial<Lead> & { name: string; email: string }): Promise<Lead> {
    const store = this.getStore();
    const isNew = !lead.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newLead: Lead = {
        id: `LEAD-${200 + store.leads.length + 1}`,
        organization_id: store.organization.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        source: lead.source || 'Website',
        lead_type: lead.lead_type || 'Buyer',
        status: lead.status || 'New',
        assigned_agent_id: lead.assigned_agent_id,
        budget_min: lead.budget_min,
        budget_max: lead.budget_max,
        property_interest: lead.property_interest || '',
        timeline: lead.timeline || '3-6 mo',
        is_preapproved: lead.is_preapproved || false,
        heat_score: lead.heat_score || 50,
        last_contact_date: lead.last_contact_date || now.split('T')[0],
        next_followup_date: lead.next_followup_date,
        notes: lead.notes || '',
        created_at: now,
        updated_at: now,
      };
      store.leads.unshift(newLead);
      this.saveStore(store);
      await this.logAudit('Leads', 'LEAD_REGISTERED', `Registered new lead ${newLead.name}`);
      return newLead;
    } else {
      const index = store.leads.findIndex((l) => l.id === lead.id);
      if (index === -1) throw new Error('Lead not found');
      store.leads[index] = {
        ...store.leads[index],
        ...lead,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Leads', 'LEAD_UPDATED', `Updated lead ${lead.name}`);
      return store.leads[index];
    }
  }

  async deleteLead(id: string): Promise<void> {
    const store = this.getStore();
    const lead = store.leads.find((l) => l.id === id);
    if (!lead) return;

    store.leads = store.leads.filter((l) => l.id !== id);
    this.saveStore(store);
    await this.logAudit('Leads', 'LEAD_DELETED', `Removed lead ${lead.name}`);
  }

  // ==========================================
  // PIPELINE DEALS
  // ==========================================
  async getDeals(): Promise<Deal[]> {
    if (this.isDemoMode) {
      return this.getStore().deals;
    }
    const { data, error } = await supabase!.from('deals').select('*');
    if (error) throw error;
    return data;
  }

  async saveDeal(deal: Partial<Deal> & { title: string; deal_value: number; assigned_agent_id: string }): Promise<Deal> {
    const store = this.getStore();
    const isNew = !deal.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newDeal: Deal = {
        id: `DEAL-${300 + store.deals.length + 1}`,
        organization_id: store.organization.id,
        title: deal.title,
        property_id: deal.property_id,
        client_id: deal.client_id,
        assigned_agent_id: deal.assigned_agent_id,
        stage: deal.stage || 'new_enquiry',
        deal_value: deal.deal_value,
        probability_pct: deal.probability_pct || 10,
        expected_close_date: deal.expected_close_date,
        notes: deal.notes || '',
        created_at: now,
        updated_at: now,
      };
      store.deals.unshift(newDeal);
      this.saveStore(store);
      await this.logAudit('Pipeline', 'DEAL_CREATED', `Logged opportunity ${newDeal.title}`);
      return newDeal;
    } else {
      const index = store.deals.findIndex((d) => d.id === deal.id);
      if (index === -1) throw new Error('Deal not found');
      store.deals[index] = {
        ...store.deals[index],
        ...deal,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Pipeline', 'DEAL_UPDATED', `Updated deal ${deal.title}`);
      return store.deals[index];
    }
  }

  async changeDealStage(dealId: string, newStage: PipelineStage): Promise<Deal> {
    const store = this.getStore();
    const deal = store.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error('Deal not found');

    const oldStage = deal.stage;
    deal.stage = newStage;
    const stageProbMap: Record<PipelineStage, number> = {
      new_enquiry: 10,
      contacted: 20,
      qualified: 40,
      viewing_scheduled: 50,
      negotiation: 70,
      offer_accepted: 90,
      closed_won: 100,
      closed_lost: 0,
    };
    deal.probability_pct = stageProbMap[newStage] ?? 50;
    deal.updated_at = new Date().toISOString();
    this.saveStore(store);
    await this.logAudit(
      'Pipeline',
      'DEAL_STAGE_CHANGED',
      `Moved deal "${deal.title}" from ${oldStage} to ${newStage}`
    );
    return deal;
  }

  async deleteDeal(id: string): Promise<void> {
    const store = this.getStore();
    const deal = store.deals.find((d) => d.id === id);
    if (!deal) return;

    store.deals = store.deals.filter((d) => d.id !== id);
    this.saveStore(store);
    await this.logAudit('Pipeline', 'DEAL_REMOVED', `Removed deal ${deal.title}`);
  }

  // ==========================================
  // CLIENTS
  // ==========================================
  async getClients(): Promise<Client[]> {
    if (this.isDemoMode) {
      return this.getStore().clients;
    }
    const { data, error } = await supabase!.from('clients').select('*').order('name');
    if (error) throw error;
    return data;
  }

  async saveClient(client: Partial<Client> & { name: string; email: string }): Promise<Client> {
    const store = this.getStore();
    const isNew = !client.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newClient: Client = {
        id: `CLI-${500 + store.clients.length + 1}`,
        organization_id: store.organization.id,
        name: client.name,
        client_type: client.client_type || 'Buyer',
        email: client.email,
        phone: client.phone || '',
        preferred_location: client.preferred_location || '',
        budget: client.budget || 0,
        assigned_agent_id: client.assigned_agent_id,
        status: client.status || 'Active',
        birthday: client.birthday,
        created_at: now,
        updated_at: now,
      };
      store.clients.unshift(newClient);
      this.saveStore(store);
      await this.logAudit('Clients', 'CLIENT_REGISTERED', `Registered client ${newClient.name}`);
      return newClient;
    } else {
      const index = store.clients.findIndex((c) => c.id === client.id);
      if (index === -1) throw new Error('Client not found');
      store.clients[index] = {
        ...store.clients[index],
        ...client,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Clients', 'CLIENT_UPDATED', `Updated client ${client.name}`);
      return store.clients[index];
    }
  }

  async deleteClient(id: string): Promise<void> {
    const store = this.getStore();
    const client = store.clients.find((c) => c.id === id);
    if (!client) return;

    store.clients = store.clients.filter((c) => c.id !== id);
    this.saveStore(store);
    await this.logAudit('Clients', 'CLIENT_REMOVED', `Removed client ${client.name}`);
  }

  // ==========================================
  // VIEWINGS
  // ==========================================
  async getViewings(): Promise<Viewing[]> {
    if (this.isDemoMode) {
      return this.getStore().viewings;
    }
    const { data, error } = await supabase!.from('viewings').select('*').order('viewing_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveViewing(viewing: Partial<Viewing> & { property_id: string; assigned_agent_id: string; viewing_date: string; viewing_time: string }): Promise<Viewing> {
    const store = this.getStore();
    const isNew = !viewing.id;
    const now = new Date().toISOString();
    const prop = store.properties.find((p) => p.id === viewing.property_id);

    if (isNew) {
      const newViewing: Viewing = {
        id: `VIEW-${600 + store.viewings.length + 1}`,
        organization_id: store.organization.id,
        property_id: viewing.property_id,
        property_title: prop ? prop.title : 'Property Showing',
        client_id: viewing.client_id,
        client_name: viewing.client_name || 'Client',
        assigned_agent_id: viewing.assigned_agent_id,
        viewing_date: viewing.viewing_date,
        viewing_time: viewing.viewing_time,
        status: viewing.status || 'Scheduled',
        rating: viewing.rating || 0,
        feedback: viewing.feedback || '',
        created_at: now,
        updated_at: now,
      };
      store.viewings.unshift(newViewing);
      this.saveStore(store);
      await this.logAudit(
        'Viewings',
        'SHOWING_SCHEDULED',
        `Scheduled showing for ${newViewing.property_title} on ${viewing.viewing_date}`
      );
      return newViewing;
    } else {
      const index = store.viewings.findIndex((v) => v.id === viewing.id);
      if (index === -1) throw new Error('Viewing not found');
      store.viewings[index] = {
        ...store.viewings[index],
        ...viewing,
        property_title: prop ? prop.title : store.viewings[index].property_title,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit(
        'Viewings',
        'SHOWING_UPDATED',
        `Updated showing for ${store.viewings[index].property_title}`
      );
      return store.viewings[index];
    }
  }

  async deleteViewing(id: string): Promise<void> {
    const store = this.getStore();
    store.viewings = store.viewings.filter((v) => v.id !== id);
    this.saveStore(store);
    await this.logAudit('Viewings', 'SHOWING_CANCELLED', `Deleted showing entry ${id}`);
  }

  // ==========================================
  // TASKS
  // ==========================================
  async getTasks(): Promise<Task[]> {
    if (this.isDemoMode) {
      return this.getStore().tasks;
    }
    const { data, error } = await supabase!.from('tasks').select('*').order('due_date');
    if (error) throw error;
    return data;
  }

  async saveTask(task: Partial<Task> & { title: string; due_date: string }): Promise<Task> {
    const store = this.getStore();
    const isNew = !task.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newTask: Task = {
        id: `TSK-${700 + store.tasks.length + 1}`,
        organization_id: store.organization.id,
        title: task.title,
        category: task.category || 'Client Follow-up',
        due_date: task.due_date,
        priority: task.priority || 'Medium',
        assigned_agent_id: task.assigned_agent_id,
        linked_property_id: task.linked_property_id,
        linked_lead_id: task.linked_lead_id,
        linked_deal_id: task.linked_deal_id,
        is_completed: false,
        created_at: now,
        updated_at: now,
      };
      store.tasks.unshift(newTask);
      this.saveStore(store);
      await this.logAudit('Tasks', 'TASK_CREATED', `Created task "${newTask.title}"`);
      return newTask;
    } else {
      const index = store.tasks.findIndex((t) => t.id === task.id);
      if (index === -1) throw new Error('Task not found');
      store.tasks[index] = {
        ...store.tasks[index],
        ...task,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Tasks', 'TASK_UPDATED', `Updated task "${task.title}"`);
      return store.tasks[index];
    }
  }

  async toggleTaskCompleted(id: string): Promise<Task> {
    const store = this.getStore();
    const task = store.tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found');
    task.is_completed = !task.is_completed;
    task.completed_at = task.is_completed ? new Date().toISOString() : undefined;
    task.updated_at = new Date().toISOString();
    this.saveStore(store);
    await this.logAudit(
      'Tasks',
      'TASK_TOGGLED',
      `Task "${task.title}" marked as ${task.is_completed ? 'COMPLETED' : 'PENDING'}`
    );
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const store = this.getStore();
    store.tasks = store.tasks.filter((t) => t.id !== id);
    this.saveStore(store);
    await this.logAudit('Tasks', 'TASK_REMOVED', `Deleted task ${id}`);
  }

  // ==========================================
  // FINANCIAL TRANSACTIONS (SETTLEMENTS)
  // ==========================================
  async getTransactions(): Promise<Transaction[]> {
    if (this.isDemoMode) {
      return this.getStore().transactions;
    }
    const { data, error } = await supabase!.from('transactions').select('*').order('closing_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveTransaction(
    tx: Partial<Transaction> & {
      property_title_snapshot: string;
      agent_id: string;
      closing_date: string;
      sale_price: number;
    }
  ): Promise<Transaction> {
    const store = this.getStore();
    const isNew = !tx.id;
    const now = new Date().toISOString();

    const commRate = tx.commission_rate ?? store.organization.default_commission_rate;
    const agencySplit = tx.agency_split_pct ?? store.organization.agency_split_pct;
    const agentSplit = tx.agent_split_pct ?? store.organization.agent_split_pct;

    const grossComm = tx.sale_price * (commRate / 100);
    const agencyShare = grossComm * (agencySplit / 100);
    const agentShare = grossComm * (agentSplit / 100);

    const agent = store.agents.find((a) => a.id === tx.agent_id);
    const agentName = agent ? agent.name : tx.agent_name_snapshot || 'Broker';

    if (isNew) {
      const ref = `SETTLE-2026-${String(store.transactions.length + 1).padStart(3, '0')}`;
      const newTx: Transaction = {
        id: `TX-${800 + store.transactions.length + 1}`,
        organization_id: store.organization.id,
        settlement_reference: ref,
        property_id: tx.property_id,
        property_title_snapshot: tx.property_title_snapshot,
        client_id: tx.client_id,
        client_name_snapshot: tx.client_name_snapshot,
        agent_id: tx.agent_id,
        agent_name_snapshot: agentName,
        closing_date: tx.closing_date,
        sale_price: tx.sale_price,
        commission_rate: commRate,
        agency_split_pct: agencySplit,
        agent_split_pct: agentSplit,
        gross_commission: grossComm,
        agency_share: agencyShare,
        agent_share: agentShare,
        notes: tx.notes || '',
        created_at: now,
      };

      store.transactions.unshift(newTx);

      // Auto-update linked property to Sold
      if (tx.property_id) {
        const prop = store.properties.find((p) => p.id === tx.property_id);
        if (prop) prop.status = 'Sold';
      }

      this.saveStore(store);
      await this.logAudit(
        'Settlement',
        'TRANSACTION_RECORDED',
        `Logged settlement ${newTx.id} for ${newTx.property_title_snapshot} ($${newTx.sale_price.toLocaleString()})`
      );
      return newTx;
    } else {
      const index = store.transactions.findIndex((t) => t.id === tx.id);
      if (index === -1) throw new Error('Transaction not found');
      store.transactions[index] = {
        ...store.transactions[index],
        ...tx,
        gross_commission: grossComm,
        agency_share: agencyShare,
        agent_share: agentShare,
      };
      this.saveStore(store);
      await this.logAudit('Settlement', 'TRANSACTION_UPDATED', `Updated settlement ${tx.id}`);
      return store.transactions[index];
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const store = this.getStore();
    const tx = store.transactions.find((t) => t.id === id);
    if (!tx) return;

    store.transactions = store.transactions.filter((t) => t.id !== id);
    this.saveStore(store);
    await this.logAudit('Settlement', 'TRANSACTION_DELETED', `Deleted settlement ${tx.id} ($${tx.sale_price.toLocaleString()})`);
  }

  // ==========================================
  // OPERATING OVERHEAD & EXPENSES
  // ==========================================
  async getExpenses(): Promise<Expense[]> {
    if (this.isDemoMode) {
      return this.getStore().expenses;
    }
    const { data, error } = await supabase!.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveExpense(expense: Partial<Expense> & { description: string; amount: number; date: string }): Promise<Expense> {
    const store = this.getStore();
    const isNew = !expense.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newExp: Expense = {
        id: `EXP-${100 + store.expenses.length + 1}`,
        organization_id: store.organization.id,
        date: expense.date,
        description: expense.description,
        category: expense.category || 'Facility & Office',
        recurrence: expense.recurrence || 'Monthly',
        amount: expense.amount,
        vendor: expense.vendor || '',
        created_at: now,
        updated_at: now,
      };
      store.expenses.unshift(newExp);
      this.saveStore(store);
      await this.logAudit('Overhead', 'EXPENSE_RECORDED', `Logged expense ${newExp.description} ($${newExp.amount.toLocaleString()})`);
      return newExp;
    } else {
      const index = store.expenses.findIndex((e) => e.id === expense.id);
      if (index === -1) throw new Error('Expense not found');
      store.expenses[index] = {
        ...store.expenses[index],
        ...expense,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Overhead', 'EXPENSE_UPDATED', `Updated expense ${expense.description}`);
      return store.expenses[index];
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const store = this.getStore();
    const exp = store.expenses.find((e) => e.id === id);
    if (!exp) return;

    store.expenses = store.expenses.filter((e) => e.id !== id);
    this.saveStore(store);
    await this.logAudit('Overhead', 'EXPENSE_DELETED', `Deleted expense ${exp.description} ($${exp.amount.toLocaleString()})`);
  }

  // ==========================================
  // AUDIT LOGS & REPORTS
  // ==========================================
  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isDemoMode) {
      return this.getStore().auditLogs;
    }
    const { data, error } = await supabase!.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async logAudit(category: string, action: string, details: string): Promise<void> {
    const store = this.getStore();
    const newLog: AuditLog = {
      id: `AUD-${1000 + store.auditLogs.length + 1}`,
      organization_id: store.organization.id,
      category,
      action,
      details,
      user_identifier: 'Nilma Fernandes (Principal Broker)',
      created_at: new Date().toISOString(),
    };
    store.auditLogs.unshift(newLog);
    if (store.auditLogs.length > 200) store.auditLogs.pop();
    this.saveStore(store);
  }

  async getFinancialSummary(dateFilter: 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'ytd' = 'all'): Promise<FinancialSummary> {
    const store = this.getStore();
    let txs = store.transactions;
    let exps = store.expenses;

    const currentYear = '2026';
    const currentMonth = '2026-11';
    const lastMonth = '2026-10';

    if (dateFilter === 'this_month') {
      txs = txs.filter((t) => t.closing_date.startsWith(currentMonth));
      exps = exps.filter((e) => e.date.startsWith(currentMonth));
    } else if (dateFilter === 'last_month') {
      txs = txs.filter((t) => t.closing_date.startsWith(lastMonth));
      exps = exps.filter((e) => e.date.startsWith(lastMonth));
    } else if (dateFilter === 'this_quarter') {
      txs = txs.filter((t) => t.closing_date >= '2026-10-01' && t.closing_date <= '2026-12-31');
      exps = exps.filter((e) => e.date >= '2026-10-01' && e.date <= '2026-12-31');
    } else if (dateFilter === 'ytd') {
      txs = txs.filter((t) => t.closing_date.startsWith(currentYear));
      exps = exps.filter((e) => e.date.startsWith(currentYear));
    }

    const grossSales = txs.reduce((sum, t) => sum + t.sale_price, 0);
    const grossComm = txs.reduce((sum, t) => sum + t.gross_commission, 0);
    const agencyRetained = txs.reduce((sum, t) => sum + t.agency_share, 0);
    const agentPayouts = txs.reduce((sum, t) => sum + t.agent_share, 0);
    const operatingExpenses = exps.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = agencyRetained - operatingExpenses;
    const margin = agencyRetained > 0 ? (netProfit / agencyRetained) * 100 : 0;

    return {
      gross_sales: grossSales,
      gross_commission: grossComm,
      agency_retained: agencyRetained,
      agent_payouts: agentPayouts,
      operating_expenses: operatingExpenses,
      net_operating_profit: netProfit,
      net_profit_margin_pct: Number(margin.toFixed(1)),
    };
  }

  // ==========================================
  // OFFERS
  // ==========================================
  async getOffers(): Promise<Offer[]> {
    if (this.isDemoMode) {
      return this.getStore().offers || [];
    }
    const { data, error } = await supabase!.from('offers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveOffer(offer: Partial<Offer> & { property_id: string; property_title: string; client_name: string; offer_amount: number; asking_price: number }): Promise<Offer> {
    const store = this.getStore();
    const isNew = !offer.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newOffer: Offer = {
        id: `OFFER-${100 + (store.offers?.length || 0) + 1}`,
        organization_id: store.organization.id,
        property_id: offer.property_id,
        property_title: offer.property_title,
        client_id: offer.client_id,
        client_name: offer.client_name,
        assigned_agent_id: offer.assigned_agent_id || store.agents[0]?.id || 'AGT-01',
        offer_amount: offer.offer_amount,
        asking_price: offer.asking_price,
        earnest_money: offer.earnest_money || Math.round(offer.offer_amount * 0.05),
        financing_type: offer.financing_type || 'Cash',
        expiration_date: offer.expiration_date || now.split('T')[0],
        proposed_closing_date: offer.proposed_closing_date || now.split('T')[0],
        status: offer.status || 'Submitted',
        counter_amount: offer.counter_amount,
        notes: offer.notes || '',
        created_at: now,
        updated_at: now,
      };
      if (!store.offers) store.offers = [];
      store.offers.unshift(newOffer);
      this.saveStore(store);
      await this.logAudit('Offers', 'OFFER_SUBMITTED', `Offer of $${newOffer.offer_amount.toLocaleString()} logged for ${newOffer.property_title}`);
      return newOffer;
    } else {
      const index = store.offers.findIndex((o) => o.id === offer.id);
      if (index === -1) throw new Error('Offer not found');
      store.offers[index] = {
        ...store.offers[index],
        ...offer,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('Offers', 'OFFER_UPDATED', `Offer ${offer.id} updated (${offer.status})`);
      return store.offers[index];
    }
  }

  async deleteOffer(id: string): Promise<void> {
    const store = this.getStore();
    store.offers = (store.offers || []).filter((o) => o.id !== id);
    this.saveStore(store);
    await this.logAudit('Offers', 'OFFER_DELETED', `Deleted offer ${id}`);
  }

  // ==========================================
  // OPEN HOUSES
  // ==========================================
  async getOpenHouses(): Promise<OpenHouse[]> {
    if (this.isDemoMode) {
      return this.getStore().openHouses || [];
    }
    const { data, error } = await supabase!.from('open_houses').select('*').order('event_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveOpenHouse(oh: Partial<OpenHouse> & { property_id: string; property_title: string; event_date: string; start_time: string; end_time: string }): Promise<OpenHouse> {
    const store = this.getStore();
    const isNew = !oh.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newOH: OpenHouse = {
        id: `OH-${200 + (store.openHouses?.length || 0) + 1}`,
        organization_id: store.organization.id,
        property_id: oh.property_id,
        property_title: oh.property_title,
        host_agent_id: oh.host_agent_id || store.agents[0]?.id || 'AGT-01',
        event_date: oh.event_date,
        start_time: oh.start_time,
        end_time: oh.end_time,
        visitor_count: oh.visitor_count || 0,
        leads_captured: oh.leads_captured || 0,
        status: oh.status || 'Scheduled',
        refreshments_notes: oh.refreshments_notes || '',
        feedback_summary: oh.feedback_summary || '',
        created_at: now,
        updated_at: now,
      };
      if (!store.openHouses) store.openHouses = [];
      store.openHouses.unshift(newOH);
      this.saveStore(store);
      await this.logAudit('OpenHouses', 'OPEN_HOUSE_SCHEDULED', `Scheduled open house for ${newOH.property_title} on ${newOH.event_date}`);
      return newOH;
    } else {
      const index = store.openHouses.findIndex((o) => o.id === oh.id);
      if (index === -1) throw new Error('Open house not found');
      store.openHouses[index] = {
        ...store.openHouses[index],
        ...oh,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('OpenHouses', 'OPEN_HOUSE_UPDATED', `Updated open house ${oh.id}`);
      return store.openHouses[index];
    }
  }

  async deleteOpenHouse(id: string): Promise<void> {
    const store = this.getStore();
    store.openHouses = (store.openHouses || []).filter((o) => o.id !== id);
    this.saveStore(store);
    await this.logAudit('OpenHouses', 'OPEN_HOUSE_DELETED', `Deleted open house ${id}`);
  }

  // ==========================================
  // LISTING PIPELINE
  // ==========================================
  async getListingOpportunities(): Promise<ListingOpportunity[]> {
    if (this.isDemoMode) {
      return this.getStore().listingOpportunities || [];
    }
    const { data, error } = await supabase!.from('listing_opportunities').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async saveListingOpportunity(opp: Partial<ListingOpportunity> & { title: string; seller_name: string; target_price: number }): Promise<ListingOpportunity> {
    const store = this.getStore();
    const isNew = !opp.id;
    const now = new Date().toISOString();

    if (isNew) {
      const newOpp: ListingOpportunity = {
        id: `LISTOPP-${300 + (store.listingOpportunities?.length || 0) + 1}`,
        organization_id: store.organization.id,
        title: opp.title,
        property_id: opp.property_id,
        seller_client_id: opp.seller_client_id || 'CLI-501',
        seller_name: opp.seller_name,
        assigned_agent_id: opp.assigned_agent_id || store.agents[0]?.id || 'AGT-01',
        target_price: opp.target_price,
        stage: opp.stage || 'new_opportunity',
        valuation_estimate: opp.valuation_estimate || opp.target_price,
        commission_rate: opp.commission_rate || store.organization.default_commission_rate,
        exclusive_period_days: opp.exclusive_period_days || 90,
        notes: opp.notes || '',
        created_at: now,
        updated_at: now,
      };
      if (!store.listingOpportunities) store.listingOpportunities = [];
      store.listingOpportunities.unshift(newOpp);
      this.saveStore(store);
      await this.logAudit('ListingPipe', 'LISTING_OPPORTUNITY_LOGGED', `Logged listing opportunity "${newOpp.title}" ($${newOpp.target_price.toLocaleString()})`);
      return newOpp;
    } else {
      const index = store.listingOpportunities.findIndex((o) => o.id === opp.id);
      if (index === -1) throw new Error('Listing opportunity not found');
      store.listingOpportunities[index] = {
        ...store.listingOpportunities[index],
        ...opp,
        updated_at: now,
      };
      this.saveStore(store);
      await this.logAudit('ListingPipe', 'LISTING_OPPORTUNITY_UPDATED', `Updated listing opportunity ${opp.id}`);
      return store.listingOpportunities[index];
    }
  }

  async changeListingStage(oppId: string, newStage: ListingStage): Promise<ListingOpportunity> {
    const store = this.getStore();
    const opp = (store.listingOpportunities || []).find((o) => o.id === oppId);
    if (!opp) throw new Error('Listing opportunity not found');
    const oldStage = opp.stage;
    opp.stage = newStage;
    opp.updated_at = new Date().toISOString();
    this.saveStore(store);
    await this.logAudit('ListingPipe', 'LISTING_STAGE_CHANGED', `Listing opportunity "${opp.title}" moved from ${oldStage} to ${newStage}`);
    return opp;
  }

  async deleteListingOpportunity(id: string): Promise<void> {
    const store = this.getStore();
    store.listingOpportunities = (store.listingOpportunities || []).filter((o) => o.id !== id);
    this.saveStore(store);
    await this.logAudit('ListingPipe', 'LISTING_OPPORTUNITY_DELETED', `Deleted listing opportunity ${id}`);
  }

  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.initLocalStore();
  }

  exportJson(): string {
    return JSON.stringify(this.getStore(), null, 2);
  }
}

export const repository = new AgencyRepository();
