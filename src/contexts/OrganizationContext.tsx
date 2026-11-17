import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Organization,
  UserRole,
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
  Offer,
  OpenHouse,
  ListingOpportunity,
  ListingStage,
  PipelineStage,
} from '../types/database';
import { repository } from '../services/agencyRepository';

interface OrganizationContextType {
  organization: Organization | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isLoading: boolean;
  isDemoMode: boolean;
  refreshOrganization: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;

  // Data Arrays
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

  // Mutators
  saveAgent: (agent: Partial<Agent> & { name: string; role: string; email: string }) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgentActive: (id: string) => Promise<Agent>;

  saveProperty: (property: Partial<Property> & { title: string; price: number; size_sqm: number }) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;

  saveLead: (lead: Partial<Lead> & { name: string; email: string }) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;

  saveDeal: (deal: Partial<Deal> & { title: string; deal_value: number; assigned_agent_id: string }) => Promise<Deal>;
  changeDealStage: (id: string, newStage: PipelineStage) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;

  saveClient: (client: Partial<Client> & { name: string; email: string }) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;

  saveViewing: (viewing: Partial<Viewing> & { property_id: string; assigned_agent_id: string; viewing_date: string; viewing_time: string }) => Promise<Viewing>;
  deleteViewing: (id: string) => Promise<void>;

  saveTask: (task: Partial<Task> & { title: string; due_date: string }) => Promise<Task>;
  toggleTaskCompleted: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  saveTransaction: (tx: Partial<Transaction> & { property_title_snapshot: string; agent_id: string; closing_date: string; sale_price: number }) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  saveExpense: (exp: Partial<Expense> & { description: string; amount: number; date: string }) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;

  saveOffer: (offer: Partial<Offer> & { property_id: string; property_title: string; client_name: string; offer_amount: number; asking_price: number }) => Promise<Offer>;
  deleteOffer: (id: string) => Promise<void>;

  saveOpenHouse: (oh: Partial<OpenHouse> & { property_id: string; property_title: string; event_date: string; start_time: string; end_time: string }) => Promise<OpenHouse>;
  deleteOpenHouse: (id: string) => Promise<void>;

  saveListingOpportunity: (opp: Partial<ListingOpportunity> & { title: string; seller_name: string; target_price: number }) => Promise<ListingOpportunity>;
  changeListingStage: (id: string, newStage: ListingStage) => Promise<ListingOpportunity>;
  deleteListingOpportunity: (id: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('agency_principal');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs] = useState<AuditLog[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [listingOpportunities, setListingOpportunities] = useState<ListingOpportunity[]>([]);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        org,
        agts,
        props,
        lds,
        dls,
        cls,
        vws,
        tsks,
        txs,
        exps,
        offs,
        ohs,
        lops,
      ] = await Promise.all([
        repository.getOrganization(),
        repository.getAgents(),
        repository.getProperties(),
        repository.getLeads(),
        repository.getDeals(),
        repository.getClients(),
        repository.getViewings(),
        repository.getTasks(),
        repository.getTransactions(),
        repository.getExpenses(),
        repository.getOffers(),
        repository.getOpenHouses(),
        repository.getListingOpportunities(),
      ]);

      setOrganization(org);
      setAgents(agts);
      setProperties(props);
      setLeads(lds);
      setDeals(dls);
      setClients(cls);
      setViewings(vws);
      setTasks(tsks);
      setTransactions(txs);
      setExpenses(exps);
      setOffers(offs);
      setOpenHouses(ohs);
      setListingOpportunities(lops);
    } catch (err) {
      console.error('Failed to load agency database', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateOrganization = async (updates: Partial<Organization>) => {
    const updated = await repository.updateOrganization(updates);
    setOrganization(updated);
  };

  const resetToDefaultData = async () => {
    repository.resetToDefaults();
    await loadAll();
  };

  // Agent handlers
  const saveAgent = async (data: any) => {
    const saved = await repository.saveAgent(data);
    await loadAll();
    return saved;
  };

  const deleteAgent = async (id: string) => {
    await repository.deleteAgent(id);
    await loadAll();
  };

  const toggleAgentActive = async (id: string) => {
    const toggled = await repository.toggleAgentActive(id);
    await loadAll();
    return toggled;
  };

  // Property handlers
  const saveProperty = async (data: any) => {
    const saved = await repository.saveProperty(data);
    await loadAll();
    return saved;
  };

  const deleteProperty = async (id: string) => {
    await repository.deleteProperty(id);
    await loadAll();
  };

  // Lead handlers
  const saveLead = async (data: any) => {
    const saved = await repository.saveLead(data);
    await loadAll();
    return saved;
  };

  const deleteLead = async (id: string) => {
    await repository.deleteLead(id);
    await loadAll();
  };

  // Deal handlers
  const saveDeal = async (data: any) => {
    const saved = await repository.saveDeal(data);
    await loadAll();
    return saved;
  };

  const changeDealStage = async (id: string, newStage: PipelineStage) => {
    const updated = await repository.changeDealStage(id, newStage);
    await loadAll();
    return updated;
  };

  const deleteDeal = async (id: string) => {
    await repository.deleteDeal(id);
    await loadAll();
  };

  // Client handlers
  const saveClient = async (data: any) => {
    const saved = await repository.saveClient(data);
    await loadAll();
    return saved;
  };

  const deleteClient = async (id: string) => {
    await repository.deleteClient(id);
    await loadAll();
  };

  // Viewing handlers
  const saveViewing = async (data: any) => {
    const saved = await repository.saveViewing(data);
    await loadAll();
    return saved;
  };

  const deleteViewing = async (id: string) => {
    await repository.deleteViewing(id);
    await loadAll();
  };

  // Task handlers
  const saveTask = async (data: any) => {
    const saved = await repository.saveTask(data);
    await loadAll();
    return saved;
  };

  const toggleTaskCompleted = async (id: string) => {
    const toggled = await repository.toggleTaskCompleted(id);
    await loadAll();
    return toggled;
  };

  const deleteTask = async (id: string) => {
    await repository.deleteTask(id);
    await loadAll();
  };

  // Transaction handlers
  const saveTransaction = async (data: any) => {
    const saved = await repository.saveTransaction(data);
    await loadAll();
    return saved;
  };

  const deleteTransaction = async (id: string) => {
    await repository.deleteTransaction(id);
    await loadAll();
  };

  // Expense handlers
  const saveExpense = async (data: any) => {
    const saved = await repository.saveExpense(data);
    await loadAll();
    return saved;
  };

  const deleteExpense = async (id: string) => {
    await repository.deleteExpense(id);
    await loadAll();
  };

  // Offer handlers
  const saveOffer = async (data: any) => {
    const saved = await repository.saveOffer(data);
    await loadAll();
    return saved;
  };

  const deleteOffer = async (id: string) => {
    await repository.deleteOffer(id);
    await loadAll();
  };

  // Open House handlers
  const saveOpenHouse = async (data: any) => {
    const saved = await repository.saveOpenHouse(data);
    await loadAll();
    return saved;
  };

  const deleteOpenHouse = async (id: string) => {
    await repository.deleteOpenHouse(id);
    await loadAll();
  };

  // Listing Opportunity handlers
  const saveListingOpportunity = async (data: any) => {
    const saved = await repository.saveListingOpportunity(data);
    await loadAll();
    return saved;
  };

  const changeListingStage = async (id: string, newStage: ListingStage) => {
    const updated = await repository.changeListingStage(id, newStage);
    await loadAll();
    return updated;
  };

  const deleteListingOpportunity = async (id: string) => {
    await repository.deleteListingOpportunity(id);
    await loadAll();
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        currentRole,
        setCurrentRole,
        isLoading,
        isDemoMode: true,
        refreshOrganization: loadAll,
        updateOrganization,
        resetToDefaultData,

        agents,
        properties,
        leads,
        deals,
        clients,
        viewings,
        tasks,
        transactions,
        expenses,
        auditLogs,
        offers,
        openHouses,
        listingOpportunities,

        saveAgent,
        deleteAgent,
        toggleAgentActive,

        saveProperty,
        deleteProperty,

        saveLead,
        deleteLead,

        saveDeal,
        changeDealStage,
        deleteDeal,

        saveClient,
        deleteClient,

        saveViewing,
        deleteViewing,

        saveTask,
        toggleTaskCompleted,
        deleteTask,

        saveTransaction,
        deleteTransaction,

        saveExpense,
        deleteExpense,

        saveOffer,
        deleteOffer,

        saveOpenHouse,
        deleteOpenHouse,

        saveListingOpportunity,
        changeListingStage,
        deleteListingOpportunity,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
