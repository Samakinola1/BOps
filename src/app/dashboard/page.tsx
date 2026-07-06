'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import {
  Briefcase,
  LogOut,
  Upload,
  Download,
  Check,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  Building,
  UserCheck,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  ArrowLeft,
  Calendar,
  FileSignature,
  FileCheck,
  Printer,
  ChevronRight,
  TrendingUp,
  User as UserIcon,
  CreditCard,
  History,
  Receipt,
  Package,
  HelpCircle,
  BookOpen,
  Menu,
  LayoutDashboard
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface CustomerMetrics {
  totalInvoices: number;
  outstandingBalance: number;
  lastPayment: { amount: number; date: string } | null;
  purchaseHistory: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    totalAmount: number;
  }>;
}

interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  totalAmount: number;
  productId?: string | null;
}

interface Quotation {
  id: string;
  customerId: string;
  quoteNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string; // Draft, Sent, Accepted, Rejected, Expired
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  customer: {
    name: string;
    businessName: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: QuotationItem[];
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  totalAmount: number;
  productId?: string | null;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
}

interface Invoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string; // Draft, Sent, Paid, Partially Paid, Overdue, Cancelled
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  customer: {
    name: string;
    businessName: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
  totalPaid: number;
  outstandingBalance: number;
}

interface ExpenseCategory {
  id: string;
  name: string;
  disabled: boolean;
  createdAt: string;
}

interface Expense {
  id: string;
  amount: number;
  vendor: string;
  categoryId: string;
  category: ExpenseCategory;
  date: string;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
}

interface InventoryTransaction {
  id: string;
  type: string;
  quantity: number;
  date: string;
  notes: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  reorderLevel: number;
  isLowStock: boolean;
  createdAt: string;
  transactions?: InventoryTransaction[];
}

export default function DashboardPage() {
  const { user, business, loading, logout, refreshSession } = useAuth();
  
  // Tabs: 'business' | 'profile' | 'customers' | 'quotations' | 'invoices' | 'expenses' | 'inventory' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'business' | 'profile' | 'customers' | 'quotations' | 'invoices' | 'expenses' | 'inventory' | 'dashboard'>('dashboard');

  // Interactive Tour Step
  const [tourStep, setTourStep] = useState(0);

  // Mobile sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Print layout state
  const [printingQuote, setPrintingQuote] = useState<Quotation | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

  // Business settings state
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoicePadding, setInvoicePadding] = useState('4');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('1');
  const [businessSubmitting, setBusinessSubmitting] = useState(false);
  const [businessMsg, setBusinessMsg] = useState({ type: '', text: '' });

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Team Management & Custom Roles states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Invite Member Modal Form state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRoleName, setInviteRoleName] = useState('Staff');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Create Custom Role Modal Form state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormPermissions, setRoleFormPermissions] = useState<string[]>([]);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Customer Form state
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerBusinessName, setCustomerBusinessName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerFormSubmitting, setCustomerFormSubmitting] = useState(false);
  const [customerFormError, setCustomerFormError] = useState('');

  // Quotation state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  // Quotation Editor Form state
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteIssueDate, setQuoteIssueDate] = useState('');
  const [quoteExpiryDate, setQuoteExpiryDate] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('Draft');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }
  ]);
  const [quoteFormSubmitting, setQuoteFormSubmitting] = useState(false);
  const [quoteFormError, setQuoteFormError] = useState('');
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Invoice Form state
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState('');
  const [invoiceIssueDate, setInvoiceIssueDate] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('Draft');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }
  ]);
  const [invoiceFormSubmitting, setInvoiceFormSubmitting] = useState(false);
  const [invoiceFormError, setInvoiceFormError] = useState('');

  // Payment Form state
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Expense & Category state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseFilterCategoryId, setExpenseFilterCategoryId] = useState('');
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Expense Form state
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState('');
  const [expenseFormSubmitting, setExpenseFormSubmitting] = useState(false);
  const [expenseFormError, setExpenseFormError] = useState('');
  const [receiptUploading, setReceiptUploading] = useState(false);

  // Category Manage modal state
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormSubmitting, setCategoryFormSubmitting] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState('');

  // Product & Inventory state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productLowStockFilter, setProductLowStockFilter] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Form state
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormName, setProductFormName] = useState('');
  const [productFormSku, setProductFormSku] = useState('');
  const [productFormDescription, setProductFormDescription] = useState('');
  const [productFormUnitPrice, setProductFormUnitPrice] = useState('');
  const [productFormCostPrice, setProductFormCostPrice] = useState('');
  const [productFormUnit, setProductFormUnit] = useState('pcs');
  const [productFormInitialStock, setProductFormInitialStock] = useState('0');
  const [productFormThreshold, setProductFormThreshold] = useState('5');
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);
  const [productFormError, setProductFormError] = useState('');

  // Stock Adjustment Form state
  const [isAdjustmentFormOpen, setIsAdjustmentFormOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState('Purchase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState('');

  // Transaction Ledger view state
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Sorting, Filtering, and Pagination state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('All');
  const [invoiceSortField, setInvoiceSortField] = useState('issueDate');
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
  const [invoiceItemsPerPage, setInvoiceItemsPerPage] = useState(10);

  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState('All');
  const [quoteSortField, setQuoteSortField] = useState('issueDate');
  const [quoteSortOrder, setQuoteSortOrder] = useState<'asc' | 'desc'>('desc');
  const [quoteCurrentPage, setQuoteCurrentPage] = useState(1);
  const [quoteItemsPerPage, setQuoteItemsPerPage] = useState(10);

  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('All');
  const [expenseSortField, setExpenseSortField] = useState('date');
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expenseItemsPerPage, setExpenseItemsPerPage] = useState(10);

  const [productSortField, setProductSortField] = useState('name');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10);

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSortField, setCustomerSortField] = useState('name');
  const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [customerItemsPerPage, setCustomerItemsPerPage] = useState(10);

  // Backups & Audit Trail
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);

  // CSV Import State
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvImportType, setCsvImportType] = useState<'products' | 'customers'>('products');
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportError, setCsvImportError] = useState('');

  // Sync state with fetched auth session data
  useEffect(() => {
    if (business) {
      setCompanyName(business.name || '');
      setAddress(business.address || '');
      setTaxNumber(business.taxNumber || '');
      setCurrency(business.currency || 'USD');
      setInvoicePrefix(business.invoicePrefix || 'INV-');
      setInvoicePadding(String(business.invoicePadding ?? 4));
      setNextInvoiceNumber(String(business.nextInvoiceNumber ?? 1));
    }
    if (user) {
      setProfileName(user.name || '');
    }
  }, [business, user]);

  // Programmatically change active tab when tour step changes
  useEffect(() => {
    if (tourStep === 1) setActiveTab('dashboard');
    if (tourStep === 2) setActiveTab('invoices');
    if (tourStep === 3) setActiveTab('quotations');
    if (tourStep === 4) setActiveTab('expenses');
    if (tourStep === 5) setActiveTab('inventory');
  }, [tourStep]);

  // Load customers list
  const loadCustomers = async (search = '') => {
    setLoadingCustomers(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch('/api/business/team');
      const data = await res.json();
      if (res.ok) {
        setTeamMembers(data.team || []);
      }
    } catch (err) {
      console.error('Failed to load team members', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadCustomRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/business/roles');
      const data = await res.json();
      if (res.ok) {
        setCustomRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Failed to load custom roles', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Load quotations list
  const loadQuotations = async () => {
    setLoadingQuotes(true);
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      if (res.ok) {
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Load invoices list
  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Database backups loading and actions
  const loadBackups = async () => {
    if (!user || user.businessUser?.roleName !== 'Owner') return;
    setLoadingBackups(true);
    setBackupError('');
    try {
      const res = await fetch('/api/business/backups');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch backups.');
      setBackups(data.backups || []);
    } catch (err: any) {
      setBackupError(err.message || 'Failed to load backups.');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupError('');
    setBackupSuccess('');
    try {
      const res = await fetch('/api/business/backups', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger backup.');
      setBackupSuccess('Database backup file created successfully!');
      loadBackups();
    } catch (err: any) {
      setBackupError(err.message || 'Failed to create backup.');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Warning: Restoring backup "${filename}" will overwrite all active database data and revert to that point. Are you sure you want to proceed?`)) {
      return;
    }
    setBackupError('');
    setBackupSuccess('');
    try {
      const res = await fetch('/api/business/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore backup.');
      setBackupSuccess('Database successfully restored! Reloading dashboard...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setBackupError(err.message || 'Failed to restore backup.');
    }
  };

  // Activity logs audit trail loading
  const loadActivityLogs = async (page = 1, search = '') => {
    const isAuthorized = user?.businessUser?.roleName === 'Owner' || user?.businessUser?.roleName === 'Admin';
    if (!user || !isAuthorized) return;
    setLoadingActivityLogs(true);
    try {
      const res = await fetch(`/api/business/activity-logs?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setActivityLogs(data.logs || []);
        setActivityCurrentPage(data.pagination?.page || 1);
        setActivityTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoadingActivityLogs(false);
    }
  };

  // Inactivity timeout session watcher (15 minutes)
  useEffect(() => {
    if (!user) return;
    let timeoutId: any;
    const INACTIVITY_TIME = 15 * 60 * 1000; // 15 mins

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Your session has expired due to 15 minutes of inactivity. Logging out...');
        logout();
      }, INACTIVITY_TIME);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Trigger loading activity logs when pagination or search changes
  useEffect(() => {
    if (activeTab === 'business' && user) {
      loadActivityLogs(activityCurrentPage, activitySearchQuery);
    }
  }, [activityCurrentPage, activitySearchQuery, activeTab, user]);

  // CSV Export utility
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInvoices = () => {
    const headers = ['Invoice Number', 'Customer Name', 'Issue Date', 'Due Date', 'Status', 'Total Amount', 'Outstanding Balance'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.customer?.name || 'N/A',
      new Date(inv.issueDate).toLocaleDateString(),
      new Date(inv.dueDate).toLocaleDateString(),
      inv.status,
      inv.totalAmount.toFixed(2),
      (inv.outstandingBalance ?? inv.totalAmount).toFixed(2)
    ]);
    downloadCSV(headers, rows, `invoices_${Date.now()}.csv`);
  };

  const handleExportQuotations = () => {
    const headers = ['Quotation Number', 'Customer Name', 'Issue Date', 'Valid Until', 'Status', 'Total Amount'];
    const rows = quotations.map(q => [
      q.quoteNumber,
      q.customer?.name || 'N/A',
      new Date(q.issueDate).toLocaleDateString(),
      new Date(q.expiryDate).toLocaleDateString(),
      q.status,
      q.totalAmount.toFixed(2)
    ]);
    downloadCSV(headers, rows, `quotations_${Date.now()}.csv`);
  };

  const handleExportExpenses = () => {
    const headers = ['Merchant/Vendor', 'Category', 'Amount', 'Date', 'Notes'];
    const rows = expenses.map(exp => [
      exp.vendor,
      exp.category?.name || 'N/A',
      exp.amount.toFixed(2),
      new Date(exp.date).toLocaleDateString(),
      exp.notes || ''
    ]);
    downloadCSV(headers, rows, `expenses_${Date.now()}.csv`);
  };

  const handleExportProducts = () => {
    const headers = ['SKU', 'Name', 'Description', 'Selling Price', 'Cost Price', 'In Stock', 'Reorder Level', 'Unit'];
    const rows = products.map(prod => [
      prod.sku,
      prod.name,
      prod.description || '',
      prod.sellingPrice.toFixed(2),
      prod.costPrice.toFixed(2),
      prod.quantity.toString(),
      prod.reorderLevel.toString(),
      prod.unit
    ]);
    downloadCSV(headers, rows, `inventory_${Date.now()}.csv`);
  };

  const handleExportCustomers = () => {
    const headers = ['Name', 'Company Name', 'Email', 'Phone', 'Address', 'Notes'];
    const rows = customers.map(cust => [
      cust.name,
      cust.businessName || '',
      cust.email || '',
      cust.phone || '',
      cust.address || '',
      cust.notes || ''
    ]);
    downloadCSV(headers, rows, `customers_${Date.now()}.csv`);
  };

  // CSV Import parsing logic
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row.');
        }

        // Clean headers mapping
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

        const parsedRows = lines.slice(1).map((line, lineIdx) => {
          // Simple split matching quote blocks
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim().replace(/^["']|["']$/g, ''));

          if (csvImportType === 'products') {
            const getVal = (key: string) => {
              const idx = headers.indexOf(key);
              return idx !== -1 ? cells[idx] : undefined;
            };

            const sellingPrice = parseFloat(getVal('sellingprice') || '0');
            const costPrice = parseFloat(getVal('costprice') || '0');
            const quantity = parseFloat(getVal('quantity') || '0');
            const reorderLevel = parseFloat(getVal('reorderlevel') || '0');

            return {
              name: getVal('name') || `Product #${lineIdx + 1}`,
              sku: getVal('sku') || `SKU-${Date.now()}-${lineIdx}`,
              description: getVal('description') || '',
              sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
              costPrice: isNaN(costPrice) ? 0 : costPrice,
              quantity: isNaN(quantity) ? 0 : quantity,
              reorderLevel: isNaN(reorderLevel) ? 5 : reorderLevel,
              unit: getVal('unit') || 'pcs',
            };
          } else {
            const getVal = (key: string) => {
              const idx = headers.indexOf(key);
              return idx !== -1 ? cells[idx] : undefined;
            };

            return {
              name: getVal('name') || `Customer #${lineIdx + 1}`,
              businessName: getVal('businessname') || '',
              email: getVal('email') || '',
              phone: getVal('phone') || '',
              address: getVal('address') || '',
              notes: getVal('notes') || '',
            };
          }
        });

        setCsvPreviewData(parsedRows);
      } catch (err: any) {
        setCsvImportError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (csvPreviewData.length === 0) return;

    setCsvImporting(true);
    setCsvImportError('');

    try {
      const endpoint = csvImportType === 'products' ? '/api/products/bulk' : '/api/customers/bulk';
      const bodyKey = csvImportType === 'products' ? 'products' : 'customers';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: csvPreviewData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import CSV data.');

      alert(data.message || 'Import completed successfully!');
      setIsCsvImportOpen(false);
      setCsvPreviewData([]);

      // Reload appropriate collections
      if (csvImportType === 'products') loadProducts();
      else loadCustomers('');
    } catch (err: any) {
      setCsvImportError(err.message || 'Bulk import failed.');
    } finally {
      setCsvImporting(false);
    }
  };

  // Load data based on tab selection
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadInvoices();
      loadExpenses();
      loadProducts();
    } else if (activeTab === 'customers') {
      loadCustomers(searchQuery);
    } else if (activeTab === 'quotations') {
      loadQuotations();
      loadCustomers(''); // Pre-load customers for dropdowns
    } else if (activeTab === 'invoices') {
      loadInvoices();
      loadCustomers(''); // Pre-load customers for dropdowns
    } else if (activeTab === 'business') {
      if (user && hasPermission(user, 'manage:team')) {
        loadTeamMembers();
        loadCustomRoles();
      }
      if (user && user.businessUser?.roleName === 'Owner') {
        loadBackups();
      }
      if (user && (user.businessUser?.roleName === 'Owner' || user.businessUser?.roleName === 'Admin')) {
        loadActivityLogs(1, '');
      }
    }
  }, [activeTab, searchQuery, user]);

  // Handle browser native print layout rendering
  useEffect(() => {
    if (printingQuote) {
      window.print();
      setPrintingQuote(null);
    }
  }, [printingQuote]);

  useEffect(() => {
    if (printingInvoice) {
      window.print();
      setPrintingInvoice(null);
    }
  }, [printingInvoice]);

  // Specific customer details & metrics
  const loadCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingMetrics(true);
    setCustomerMetrics(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      const data = await res.json();
      if (res.ok) {
        setCustomerMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load customer metrics', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Specific quote details
  const loadQuoteDetails = async (quote: Quotation) => {
    setSelectedQuote(null);
    setLoadingMetrics(true);
    try {
      const res = await fetch(`/api/quotations/${quote.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedQuote(data.quotation);
      }
    } catch (err) {
      console.error('Failed to load quote details', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Specific invoice details
  const loadInvoiceDetails = async (invoice: Invoice) => {
    setSelectedInvoice(null);
    setLoadingMetrics(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedInvoice(data.invoice);
      }
    } catch (err) {
      console.error('Failed to load invoice details', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Customer Form management
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerName('');
    setCustomerBusinessName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerNotes('');
    setCustomerFormError('');
    setIsCustomerFormOpen(true);
  };

  const handleOpenEditCustomer = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setCustomerName(customer.name);
    setCustomerBusinessName(customer.businessName || '');
    setCustomerPhone(customer.phone || '');
    setCustomerEmail(customer.email || '');
    setCustomerAddress(customer.address || '');
    setCustomerNotes(customer.notes || '');
    setCustomerFormError('');
    setIsCustomerFormOpen(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      setCustomerFormError('Name is required.');
      return;
    }

    setCustomerFormSubmitting(true);
    setCustomerFormError('');

    const payload = {
      name: customerName,
      businessName: customerBusinessName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      notes: customerNotes,
    };

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsCustomerFormOpen(false);
        loadCustomers(searchQuery);
        if (editingCustomer && selectedCustomer?.id === editingCustomer.id) {
          setSelectedCustomer(data.customer);
        }
      } else {
        setCustomerFormError(data.error || 'Failed to save customer');
      }
    } catch (err) {
      setCustomerFormError('Network error. Please try again.');
    } finally {
      setCustomerFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this customer? This will also delete all linked invoices and quotations.')) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(null);
          setCustomerMetrics(null);
        }
        loadCustomers(searchQuery);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete customer.');
      }
    } catch (err) {
      alert('Network error deleting customer.');
    }
  };

  // Quotation Editor logic
  const handleOpenAddQuote = () => {
    setEditingQuote(null);
    setQuoteCustomerId(customers[0]?.id || '');
    setQuoteIssueDate(new Date().toISOString().split('T')[0]);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    setQuoteExpiryDate(expiry.toISOString().split('T')[0]);
    setQuoteStatus('Draft');
    setQuoteNotes('');
    setQuoteItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }]);
    setQuoteFormError('');
    setIsQuoteFormOpen(true);
  };

  const handleOpenEditQuote = (quote: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingQuote(quote);
    setQuoteCustomerId(quote.customerId || '');
    setQuoteIssueDate(quote.issueDate.split('T')[0]);
    setQuoteExpiryDate(quote.expiryDate.split('T')[0]);
    setQuoteStatus(quote.status);
    setQuoteNotes(quote.notes || '');
    setQuoteItems(quote.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountRate: item.discountRate,
      totalAmount: item.totalAmount,
      productId: item.productId,
    })));
    setQuoteFormError('');
    setIsQuoteFormOpen(true);
  };

  const handleAddLineItem = () => {
    setQuoteItems([...quoteItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (quoteItems.length === 1) return;
    const newItems = [...quoteItems];
    newItems.splice(index, 1);
    setQuoteItems(newItems);
  };

  const handleLineItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...quoteItems];
    const item = { ...newItems[index] };

    if (field === 'description') {
      item.description = value;
    } else {
      const numVal = parseFloat(value) || 0;
      if (field === 'quantity') item.quantity = numVal;
      if (field === 'unitPrice') item.unitPrice = numVal;
      if (field === 'taxRate') item.taxRate = numVal;
      if (field === 'discountRate') item.discountRate = numVal;
    }

    const subtotal = item.quantity * item.unitPrice;
    const discount = subtotal * (item.discountRate / 100);
    const tax = (subtotal - discount) * (item.taxRate / 100);
    item.totalAmount = subtotal - discount + tax;

    newItems[index] = item;
    setQuoteItems(newItems);
  };

  const getTotals = () => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let grandTotal = 0;

    quoteItems.forEach(item => {
      const itemSub = item.quantity * item.unitPrice;
      const itemDisc = itemSub * (item.discountRate / 100);
      const itemTax = (itemSub - itemDisc) * (item.taxRate / 100);
      
      subtotal += itemSub;
      discount += itemDisc;
      tax += itemTax;
      grandTotal += itemSub - itemDisc + itemTax;
    });

    return { subtotal, discount, tax, grandTotal };
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteCustomerId || quoteItems.some(item => !item.description)) {
      setQuoteFormError('Please select a customer and complete description fields for all items.');
      return;
    }

    setQuoteFormSubmitting(true);
    setQuoteFormError('');

    const payload = {
      customerId: quoteCustomerId,
      issueDate: quoteIssueDate,
      expiryDate: quoteExpiryDate,
      status: quoteStatus,
      notes: quoteNotes,
      items: quoteItems,
    };

    try {
      const url = editingQuote ? `/api/quotations/${editingQuote.id}` : '/api/quotations';
      const method = editingQuote ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsQuoteFormOpen(false);
        loadQuotations();
        if (editingQuote && selectedQuote?.id === editingQuote.id) {
          setSelectedQuote(data.quotation);
        }
      } else {
        setQuoteFormError(data.error || 'Failed to save quotation');
      }
    } catch (err) {
      setQuoteFormError('Network error occurred.');
    } finally {
      setQuoteFormSubmitting(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(null);
        }
        loadQuotations();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete quotation.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  const handleConvertQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to convert this quotation into a draft Invoice?')) {
      return;
    }
    setConvertingQuoteId(quoteId);

    try {
      const res = await fetch(`/api/quotations/${quoteId}/convert`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Successfully converted quotation into Invoice ${data.invoice.invoiceNumber}!`);
        loadQuotations();
        if (selectedQuote?.id === quoteId) {
          loadQuoteDetails(selectedQuote);
        }
      } else {
        alert(data.error || 'Failed to convert quotation.');
      }
    } catch (err) {
      alert('Network error occurred.');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  // Invoice Form & UI handlers
  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceCustomerId(customers[0]?.id || '');
    setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setInvoiceDueDate(due.toISOString().split('T')[0]);
    setInvoiceStatus('Draft');
    setInvoiceNotes('');
    setInvoiceItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }]);
    setInvoiceFormError('');
    setIsInvoiceFormOpen(true);
  };

  const handleOpenEditInvoice = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingInvoice(invoice);
    setInvoiceCustomerId(invoice.customerId || '');
    setInvoiceIssueDate(invoice.issueDate.split('T')[0]);
    setInvoiceDueDate(invoice.dueDate.split('T')[0]);
    setInvoiceStatus(invoice.status);
    setInvoiceNotes(invoice.notes || '');
    setInvoiceItems(invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountRate: item.discountRate,
      totalAmount: item.totalAmount,
      productId: item.productId,
    })));
    setInvoiceFormError('');
    setIsInvoiceFormOpen(true);
  };

  const handleAddInvoiceLineItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, totalAmount: 0 }]);
  };

  const handleRemoveInvoiceLineItem = (index: number) => {
    if (invoiceItems.length === 1) return;
    const newItems = [...invoiceItems];
    newItems.splice(index, 1);
    setInvoiceItems(newItems);
  };

  const handleInvoiceLineItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceItems];
    const item = { ...newItems[index] };

    if (field === 'description') {
      item.description = value;
    } else {
      const numVal = parseFloat(value) || 0;
      if (field === 'quantity') item.quantity = numVal;
      if (field === 'unitPrice') item.unitPrice = numVal;
      if (field === 'taxRate') item.taxRate = numVal;
      if (field === 'discountRate') item.discountRate = numVal;
    }

    const subtotal = item.quantity * item.unitPrice;
    const discount = subtotal * (item.discountRate / 100);
    const tax = (subtotal - discount) * (item.taxRate / 100);
    item.totalAmount = subtotal - discount + tax;

    newItems[index] = item;
    setInvoiceItems(newItems);
  };

  const getInvoiceTotals = () => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let grandTotal = 0;

    invoiceItems.forEach(item => {
      const itemSub = item.quantity * item.unitPrice;
      const itemDisc = itemSub * (item.discountRate / 100);
      const itemTax = (itemSub - itemDisc) * (item.taxRate / 100);
      
      subtotal += itemSub;
      discount += itemDisc;
      tax += itemTax;
      grandTotal += itemSub - itemDisc + itemTax;
    });

    return { subtotal, discount, tax, grandTotal };
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceCustomerId || invoiceItems.some(item => !item.description)) {
      setInvoiceFormError('Customer and all line item descriptions are required.');
      return;
    }

    setInvoiceFormSubmitting(true);
    setInvoiceFormError('');

    const payload = {
      customerId: invoiceCustomerId,
      issueDate: invoiceIssueDate,
      dueDate: invoiceDueDate,
      status: invoiceStatus,
      notes: invoiceNotes,
      items: invoiceItems,
    };

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsInvoiceFormOpen(false);
        loadInvoices();
        if (editingInvoice && selectedInvoice?.id === editingInvoice.id) {
          setSelectedInvoice(data.invoice);
        }
      } else {
        setInvoiceFormError(data.error || 'Failed to save invoice');
      }
    } catch (err) {
      setInvoiceFormError('Network error occurred.');
    } finally {
      setInvoiceFormSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this invoice? Recorded payments will also be permanently deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedInvoice?.id === invoiceId) {
          setSelectedInvoice(null);
        }
        loadInvoices();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete invoice.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // Payment Recording logic
  const handleOpenRecordPayment = () => {
    if (!selectedInvoice) return;
    setPaymentAmount(String(selectedInvoice.outstandingBalance));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setPaymentNotes('');
    setPaymentError('');
    setIsPaymentFormOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError('');

    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          date: paymentDate,
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsPaymentFormOpen(false);
        loadInvoiceDetails(selectedInvoice);
        loadInvoices();
      } else {
        setPaymentError(data.error || 'Failed to record payment');
      }
    } catch (err) {
      setPaymentError('Network error occurred.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Calculate category aggregates for the donut chart and progress list
  const getCategoryStats = () => {
    const statsMap: Record<string, { name: string; amount: number; color: string }> = {};
    const colors = [
      '#45f3ff', // Cyan
      '#6f42c1', // Purple
      '#86c232', // Lime Green
      '#ff5a5f', // Red/Coral
      '#ffb400', // Orange/Yellow
      '#00a699', // Teal
      '#3b5998', // Dark Blue
      '#ea4c89', // Pink
      '#f2d653', // Yellow
      '#71b12b', // Olive
      '#b382cf', // Lavender
      '#5faef7'  // Light Blue
    ];
    
    // Initialize stats map for all categories
    categories.forEach((cat, idx) => {
      statsMap[cat.id] = {
        name: cat.name,
        amount: 0,
        color: colors[idx % colors.length]
      };
    });

    // Populate actual spending amounts
    expenses.forEach(exp => {
      if (statsMap[exp.categoryId]) {
        statsMap[exp.categoryId].amount += exp.amount;
      }
    });

    const total = Object.values(statsMap).reduce((s, c) => s + c.amount, 0);

    const statsList = Object.entries(statsMap)
      .map(([id, item]) => ({
        id,
        name: item.name,
        amount: item.amount,
        color: item.color,
        percentage: total > 0 ? (item.amount / total) * 100 : 0
      }))
      .filter(item => item.amount > 0) // Only list categories with spending
      .sort((a, b) => b.amount - a.amount);

    return { statsList, total };
  };

  // Load expenses from database
  const loadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const categoryFilter = expenseFilterCategoryId ? `&categoryId=${expenseFilterCategoryId}` : '';
      const searchFilter = expenseSearchQuery ? `&search=${encodeURIComponent(expenseSearchQuery)}` : '';
      const res = await fetch(`/api/expenses?${categoryFilter}${searchFilter}`);
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Load categories from database
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/expenses/categories');
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Trigger reloading of categories and expenses on tab change or filters change
  useEffect(() => {
    if (activeTab === 'expenses') {
      loadExpenses();
      loadCategories();
    }
  }, [activeTab, expenseFilterCategoryId, expenseSearchQuery]);

  // Expense Modal state helpers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseVendor('');
    // Pick first active (non-disabled) category
    const activeCats = categories.filter(c => !c.disabled);
    setExpenseCategoryId(activeCats[0]?.id || '');
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseNotes('');
    setExpenseReceiptUrl('');
    setExpenseFormError('');
    setIsExpenseFormOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExpense(expense);
    setExpenseVendor(expense.vendor);
    setExpenseCategoryId(expense.categoryId);
    setExpenseAmount(String(expense.amount));
    setExpenseDate(expense.date.split('T')[0]);
    setExpenseNotes(expense.notes || '');
    setExpenseReceiptUrl(expense.receiptUrl || '');
    setExpenseFormError('');
    setIsExpenseFormOpen(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseVendor || !expenseCategoryId || !expenseAmount || !expenseDate) {
      setExpenseFormError('Vendor, category, amount, and date are required.');
      return;
    }

    setExpenseFormSubmitting(true);
    setExpenseFormError('');

    const payload = {
      vendor: expenseVendor,
      categoryId: expenseCategoryId,
      amount: parseFloat(expenseAmount),
      date: expenseDate,
      notes: expenseNotes,
      receiptUrl: expenseReceiptUrl,
    };

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsExpenseFormOpen(false);
        loadExpenses();
      } else {
        setExpenseFormError(data.error || 'Failed to save expense record.');
      }
    } catch (err) {
      setExpenseFormError('Network error occurred.');
    } finally {
      setExpenseFormSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadExpenses();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete expense record.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptUploading(true);
    setExpenseFormError('');

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/expenses/receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setExpenseReceiptUrl(data.receiptUrl);
      } else {
        setExpenseFormError(data.error || 'Failed to upload receipt file.');
      }
    } catch (err) {
      setExpenseFormError('Network error uploading file.');
    } finally {
      setReceiptUploading(false);
    }
  };

  // Category Manager CRUD handlers
  const handleCategoryCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormName || categoryFormName.trim() === '') {
      setCategoryFormError('Category name is required.');
      return;
    }

    setCategoryFormSubmitting(true);
    setCategoryFormError('');

    try {
      const res = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryFormName }),
      });

      const data = await res.json();
      if (res.ok) {
        setCategoryFormName('');
        loadCategories();
      } else {
        setCategoryFormError(data.error || 'Failed to create category.');
      }
    } catch (err) {
      setCategoryFormError('Network error occurred.');
    } finally {
      setCategoryFormSubmitting(false);
    }
  };

  const handleToggleCategoryDisable = async (cat: ExpenseCategory) => {
    try {
      const res = await fetch(`/api/expenses/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !cat.disabled }),
      });

      if (res.ok) {
        loadCategories();
        loadExpenses(); // Reload list since some categories might hide or disable
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update category.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this custom category? This action is permanent.')) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/categories/${catId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadCategories();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // Load products list
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const lowStockParam = productLowStockFilter ? '&lowStockOnly=true' : '';
      const searchParam = productSearchQuery ? `&search=${encodeURIComponent(productSearchQuery)}` : '';
      const res = await fetch(`/api/products?${lowStockParam}${searchParam}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Reload products automatically when search parameters or filters change
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadProducts();
    }
  }, [activeTab, productSearchQuery, productLowStockFilter]);

  // Product Editor Modal helpers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormName('');
    setProductFormSku('');
    setProductFormDescription('');
    setProductFormUnitPrice('');
    setProductFormCostPrice('');
    setProductFormUnit('pcs');
    setProductFormInitialStock('0');
    setProductFormThreshold('5');
    setProductFormError('');
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(prod);
    setProductFormName(prod.name);
    setProductFormSku(prod.sku);
    setProductFormDescription(prod.description || '');
    setProductFormUnitPrice(String(prod.sellingPrice));
    setProductFormCostPrice(String(prod.costPrice));
    setProductFormUnit(prod.unit || 'pcs');
    setProductFormInitialStock(String(prod.quantity));
    setProductFormThreshold(String(prod.reorderLevel));
    setProductFormError('');
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormName || !productFormSku || !productFormUnitPrice) {
      setProductFormError('Product name, SKU, and selling price are required.');
      return;
    }

    setProductFormSubmitting(true);
    setProductFormError('');

    const payload = {
      name: productFormName,
      sku: productFormSku,
      description: productFormDescription,
      sellingPrice: parseFloat(productFormUnitPrice),
      costPrice: parseFloat(productFormCostPrice) || 0,
      quantity: parseFloat(productFormInitialStock) || 0,
      reorderLevel: parseFloat(productFormThreshold) || 5,
      unit: productFormUnit || 'pcs',
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsProductFormOpen(false);
        loadProducts();
      } else {
        setProductFormError(data.error || 'Failed to save product details.');
      }
    } catch (err) {
      setProductFormError('Network error occurred.');
    } finally {
      setProductFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product? Historical invoices and quotes referencing it will be preserved, but stock level tracking will end.')) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadProducts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  // Stock Adjustment Form helpers
  const handleOpenAdjustStock = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdjustingProduct(prod);
    setAdjustmentType('Purchase');
    setAdjustmentQuantity('');
    setAdjustmentNotes('');
    setAdjustmentError('');
    setIsAdjustmentFormOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const qty = parseFloat(adjustmentQuantity);
    if (isNaN(qty) || qty === 0) {
      setAdjustmentError('Please enter a valid non-zero adjustment quantity.');
      return;
    }

    setAdjustmentSubmitting(true);
    setAdjustmentError('');

    let quantityChange = qty;
    if (adjustmentType === 'Sale' || adjustmentType === 'Adjustment_Deduct') {
      quantityChange = -Math.abs(qty);
    } else {
      quantityChange = Math.abs(qty);
    }

    const payload = {
      type: adjustmentType.startsWith('Adjustment') ? 'Adjustment' : adjustmentType,
      quantityChange,
      notes: adjustmentNotes,
    };

    try {
      const res = await fetch(`/api/products/${adjustingProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAdjustmentFormOpen(false);
        loadProducts();
      } else {
        setAdjustmentError(data.error || 'Failed to adjust stock level.');
      }
    } catch (err) {
      setAdjustmentError('Network error occurred.');
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  // Transaction Ledger Modal helpers
  const handleOpenLedger = async (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setLedgerProduct(prod);
    setLedgerTransactions([]);
    setLoadingLedger(true);
    setIsLedgerOpen(true);

    try {
      const res = await fetch(`/api/products/${prod.id}`);
      const data = await res.json();
      if (res.ok) {
        setLedgerTransactions(data.product.inventoryTransactions || []);
      } else {
        alert(data.error || 'Failed to load ledger history.');
      }
    } catch (err) {
      alert('Network error loading history.');
    } finally {
      setLoadingLedger(false);
    }
  };

  // Settings Save logic
  const handleBusinessSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessSubmitting(true);
    setBusinessMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          address,
          taxNumber,
          currency,
          invoicePrefix,
          invoicePadding,
          nextInvoiceNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBusinessMsg({ type: 'success', text: 'Business settings updated successfully.' });
        await refreshSession();
      } else {
        setBusinessMsg({ type: 'error', text: data.error || 'Failed to update business settings' });
      }
    } catch (err) {
      setBusinessMsg({ type: 'error', text: 'Network error occurred. Please try again.' });
    } finally {
      setBusinessSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Only image files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File size exceeds the 2MB limit.');
      return;
    }

    setLogoUploading(true);
    setLogoError('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/business/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        await refreshSession();
      } else {
        setLogoError(data.error || 'Failed to upload logo');
      }
    } catch (err) {
      setLogoError('Network error uploading file.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileMsg({ type: '', text: '' });

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
      setProfileSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshSession();
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Network error occurred. Please try again.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Team Management & Custom Roles handlers
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSubmitting(true);
    setInviteError('');
    try {
      const res = await fetch('/api/business/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          roleName: inviteRoleName,
          roleId: inviteRoleId || undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRoleName('Staff');
        setInviteRoleId('');
        loadTeamMembers();
      } else {
        setInviteError(data.error || 'Failed to send invite.');
      }
    } catch (err) {
      setInviteError('Network error occurred.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member? All logins and association parameters for this user will be revoked immediately.')) {
      return;
    }
    try {
      const res = await fetch(`/api/business/team/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadTeamMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete team member.');
      }
    } catch (err) {
      alert('Network error removing team member.');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName || roleFormPermissions.length === 0) {
      setRoleError('Role name and at least one permission are required.');
      return;
    }
    setRoleSubmitting(true);
    setRoleError('');
    try {
      const res = await fetch('/api/business/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleFormName,
          permissions: roleFormPermissions.join(',')
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsRoleModalOpen(false);
        setRoleFormName('');
        setRoleFormPermissions([]);
        loadCustomRoles();
      } else {
        setRoleError(data.error || 'Failed to create role.');
      }
    } catch (err) {
      setRoleError('Network error occurred.');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleDeleteCustomRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom role? This will check that no active members are using it first.')) {
      return;
    }
    try {
      const res = await fetch(`/api/business/roles/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadCustomRoles();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete custom role.');
      }
    } catch (err) {
      alert('Network error deleting custom role.');
    }
  };

  const handlePermissionToggle = (perm: string) => {
    if (roleFormPermissions.includes(perm)) {
      setRoleFormPermissions(roleFormPermissions.filter(p => p !== perm));
    } else {
      setRoleFormPermissions([...roleFormPermissions, perm]);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0c10]">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#45f3ff]" />
          <p className="mt-4 text-[#c5c6c7] text-sm font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // --- CLIENT-SIDE SORTING, FILTERING & PAGINATION CALCULATIONS ---

  // 1. INVOICES
  const getProcessedInvoices = () => {
    let result = [...invoices];

    if (invoiceSearch) {
      const q = invoiceSearch.toLowerCase();
      result = result.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.customer?.name && inv.customer.name.toLowerCase().includes(q))
      );
    }

    if (invoiceFilterStatus !== 'All') {
      result = result.filter(inv => inv.status === invoiceFilterStatus);
    }

    result.sort((a: any, b: any) => {
      let valA = a[invoiceSortField];
      let valB = b[invoiceSortField];

      if (invoiceSortField === 'customer') {
        valA = a.customer?.name || '';
        valB = b.customer?.name || '';
      }

      if (typeof valA === 'string') {
        return invoiceSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return invoiceSortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  };

  const processedInvoices = getProcessedInvoices();
  const invoiceTotalPages = Math.ceil(processedInvoices.length / invoiceItemsPerPage) || 1;
  const paginatedInvoices = processedInvoices.slice(
    (invoiceCurrentPage - 1) * invoiceItemsPerPage,
    invoiceCurrentPage * invoiceItemsPerPage
  );

  // 2. QUOTATIONS
  const getProcessedQuotations = () => {
    let result = [...quotations];

    if (quoteSearch) {
      const q = quoteSearch.toLowerCase();
      result = result.filter(
        item =>
          item.quoteNumber.toLowerCase().includes(q) ||
          (item.customer?.name && item.customer.name.toLowerCase().includes(q))
      );
    }

    if (quoteFilterStatus !== 'All') {
      result = result.filter(item => item.status === quoteFilterStatus);
    }

    result.sort((a: any, b: any) => {
      let valA = a[quoteSortField];
      let valB = b[quoteSortField];

      if (quoteSortField === 'customer') {
        valA = a.customer?.name || '';
        valB = b.customer?.name || '';
      }

      if (typeof valA === 'string') {
        return quoteSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return quoteSortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  };

  const processedQuotations = getProcessedQuotations();
  const quoteTotalPages = Math.ceil(processedQuotations.length / quoteItemsPerPage) || 1;
  const paginatedQuotations = processedQuotations.slice(
    (quoteCurrentPage - 1) * quoteItemsPerPage,
    quoteCurrentPage * quoteItemsPerPage
  );

  // 3. EXPENSES
  const getProcessedExpenses = () => {
    let result = [...expenses];

    if (expenseSearch) {
      const q = expenseSearch.toLowerCase();
      result = result.filter(
        exp =>
          exp.vendor.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q))
      );
    }

    if (expenseFilterCategory !== 'All') {
      result = result.filter(exp => exp.categoryId === expenseFilterCategory);
    }

    result.sort((a: any, b: any) => {
      let valA = a[expenseSortField];
      let valB = b[expenseSortField];

      if (expenseSortField === 'category') {
        valA = a.category?.name || '';
        valB = b.category?.name || '';
      }

      if (typeof valA === 'string') {
        return expenseSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return expenseSortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  };

  const processedExpenses = getProcessedExpenses();
  const expenseTotalPages = Math.ceil(processedExpenses.length / expenseItemsPerPage) || 1;
  const paginatedExpenses = processedExpenses.slice(
    (expenseCurrentPage - 1) * expenseItemsPerPage,
    expenseCurrentPage * expenseItemsPerPage
  );

  // 4. PRODUCTS (INVENTORY)
  const getProcessedProducts = () => {
    let result = [...products];

    if (productSearchQuery) {
      const q = productSearchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (productLowStockFilter) {
      result = result.filter(p => p.quantity <= p.reorderLevel);
    }

    result.sort((a: any, b: any) => {
      const valA = a[productSortField];
      const valB = b[productSortField];

      if (typeof valA === 'string') {
        return productSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return productSortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  };

  const processedProducts = getProcessedProducts();
  const productTotalPages = Math.ceil(processedProducts.length / productItemsPerPage) || 1;
  const paginatedProducts = processedProducts.slice(
    (productCurrentPage - 1) * productItemsPerPage,
    productCurrentPage * productItemsPerPage
  );

  // 5. CUSTOMERS
  const getProcessedCustomers = () => {
    let result = [...customers];

    if (customerSearchQuery) {
      const q = customerSearchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.businessName && c.businessName.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    result.sort((a: any, b: any) => {
      const valA = a[customerSortField] || '';
      const valB = b[customerSortField] || '';

      if (typeof valA === 'string') {
        return customerSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return customerSortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  };

  const processedCustomers = getProcessedCustomers();
  const customerTotalPages = Math.ceil(processedCustomers.length / customerItemsPerPage) || 1;
  const paginatedCustomers = processedCustomers.slice(
    (customerCurrentPage - 1) * customerItemsPerPage,
    customerCurrentPage * customerItemsPerPage
  );

  if (!user) return null;

  const handleBusinessSaveLocal = async (e: React.FormEvent) => {
    await handleBusinessSave(e);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0b0c10] text-[#c5c6c7] min-h-screen relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[180px] opacity-5 pointer-events-none print:hidden" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[180px] opacity-5 pointer-events-none print:hidden" />

      {/* -------------------- PRINT WORKSPACE OVERLAYS -------------------- */}
      {/* Quote print */}
      <div id="print-area" className="hidden print:block bg-white text-black p-12 min-h-screen w-full font-sans">
        {printingQuote && (
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b border-gray-300 pb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">{companyName || 'My Company'}</h1>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{address}</p>
                {taxNumber && <p className="text-xs text-gray-400 mt-1">Tax ID: {taxNumber}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-extrabold tracking-wider text-gray-300 font-mono">QUOTATION</h2>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold">Quote Number:</span> {printingQuote.quoteNumber}</p>
                  <p><span className="font-semibold">Issue Date:</span> {new Date(printingQuote.issueDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Valid Until:</span> {new Date(printingQuote.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Bill To</h3>
              <div className="mt-2 text-sm text-gray-800">
                <p className="font-bold text-md text-black">{printingQuote.customer.name}</p>
                {printingQuote.customer.businessName && <p className="font-semibold">{printingQuote.customer.businessName}</p>}
                {printingQuote.customer.address && <p className="whitespace-pre-line mt-1">{printingQuote.customer.address}</p>}
                {printingQuote.customer.email && <p className="mt-1">{printingQuote.customer.email}</p>}
                {printingQuote.customer.phone && <p>{printingQuote.customer.phone}</p>}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400 bg-gray-100 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Tax %</th>
                  <th className="py-3 px-4 text-right">Disc %</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {printingQuote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{item.description}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                    <td className="py-3 px-4 text-right">{item.discountRate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-black">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-4 border-t border-gray-300">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                    printingQuote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                  )}</span>
                </div>
                {printingQuote.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingQuote.discountAmount)}</span>
                  </div>
                )}
                {printingQuote.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingQuote.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-400 pt-2 text-base font-black text-black">
                  <span>Total Amount:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingQuote.totalAmount)}</span>
                </div>
              </div>
            </div>

            {printingQuote.notes && (
              <div className="border-t border-gray-300 pt-6 mt-12 space-y-2 text-xs text-gray-600 leading-relaxed">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider">Terms & Notes</h4>
                <p className="whitespace-pre-line">{printingQuote.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice print */}
        {printingInvoice && (
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b border-gray-300 pb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">{companyName || 'My Company'}</h1>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{address}</p>
                {taxNumber && <p className="text-xs text-gray-400 mt-1">Tax ID: {taxNumber}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-extrabold tracking-wider text-gray-300 font-mono">INVOICE</h2>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p><span className="font-semibold">Invoice Number:</span> {printingInvoice.invoiceNumber}</p>
                  <p><span className="font-semibold">Issue Date:</span> {new Date(printingInvoice.issueDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Due Date:</span> {new Date(printingInvoice.dueDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Status:</span> {printingInvoice.status}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Bill To</h3>
              <div className="mt-2 text-sm text-gray-800">
                <p className="font-bold text-md text-black">{printingInvoice.customer.name}</p>
                {printingInvoice.customer.businessName && <p className="font-semibold">{printingInvoice.customer.businessName}</p>}
                {printingInvoice.customer.address && <p className="whitespace-pre-line mt-1">{printingInvoice.customer.address}</p>}
                {printingInvoice.customer.email && <p className="mt-1">{printingInvoice.customer.email}</p>}
                {printingInvoice.customer.phone && <p>{printingInvoice.customer.phone}</p>}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-400 bg-gray-100 text-xs font-bold uppercase tracking-wider text-gray-700">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Tax %</th>
                  <th className="py-3 px-4 text-right">Disc %</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {printingInvoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{item.description}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                    <td className="py-3 px-4 text-right">{item.discountRate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-black">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-4 border-t border-gray-300">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                    printingInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                  )}</span>
                </div>
                {printingInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingInvoice.discountAmount)}</span>
                  </div>
                )}
                {printingInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingInvoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-400 pt-2 text-base font-black text-black">
                  <span>Total Invoiced:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Paid:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingInvoice.totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-gray-900">
                  <span>Remaining Balance:</span>
                  <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(printingInvoice.outstandingBalance)}</span>
                </div>
              </div>
            </div>

            {printingInvoice.notes && (
              <div className="border-t border-gray-300 pt-6 mt-12 space-y-2 text-xs text-gray-600 leading-relaxed">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider">Terms & Notes</h4>
                <p className="whitespace-pre-line">{printingInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile top navigation header */}
      <header className="flex md:hidden items-center justify-between bg-[#1f2833]/60 backdrop-blur-md border-b border-gray-800/80 px-4 py-3 shrink-0 z-20 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#45f3ff] to-[#6f42c1] flex items-center justify-center text-[#0b0c10] font-bold text-lg shadow-md">
            BO
          </div>
          <h1 className="font-extrabold text-white text-sm tracking-tight">Ops Suite</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-lg bg-gray-800/60 border border-gray-700 text-gray-400 hover:text-white focus:outline-none"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop overlay for mobile sidebar drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-[#0b0c10]/95 md:bg-[#1f2833]/40 backdrop-blur-md border-r border-gray-800/80 flex flex-col py-6 px-4 z-40 transform transition-transform duration-300 ease-in-out md:transform-none md:transition-none print:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex items-center justify-between md:justify-start space-x-3 px-3 mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-[#45f3ff] to-[#6f42c1] flex items-center justify-center text-[#0b0c10] font-bold text-xl shadow-md">
              BO
            </div>
            <div>
              <h1 className="font-extrabold text-white text-md tracking-tight">Ops Suite</h1>
              <p className="text-[10px] text-[#45f3ff] uppercase tracking-widest font-bold">Foundation v1</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-[#1f2833]/60 border border-gray-800 rounded-xl p-4 mb-6 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-white font-bold uppercase shadow-inner">
            {user.name ? user.name[0] : user.email[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name || 'User Profile'}</p>
            <span className="inline-flex items-center text-[10px] text-[#86c232] font-semibold">
              <UserCheck className="h-3 w-3 mr-1" />
              {user.emailVerified ? 'Verified Account' : 'Unverified'}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 mr-3 text-[#45f3ff]" />
            Dashboard Hub
          </button>

          {hasPermission(user, 'view:invoices') && (
            <button
              onClick={() => { setActiveTab('invoices'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'invoices'
                  ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                  : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
              }`}
            >
              <Receipt className="h-5 w-5 mr-3" />
              Invoices
            </button>
          )}

          {hasPermission(user, 'view:quotations') && (
            <button
              onClick={() => { setActiveTab('quotations'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'quotations'
                  ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                  : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
              }`}
            >
              <FileSignature className="h-5 w-5 mr-3" />
              Quotations
            </button>
          )}

          {hasPermission(user, 'view:expenses') && (
            <button
              onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                  : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-5 w-5 mr-3" />
              Expenses
            </button>
          )}

          {hasPermission(user, 'view:inventory') && (
            <button
              onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                  : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
              }`}
            >
              <Package className="h-5 w-5 mr-3" />
              Inventory
            </button>
          )}

          {hasPermission(user, 'view:customers') && (
            <button
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'customers'
                  ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                  : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Customers
            </button>
          )}

          <button
            onClick={() => { setActiveTab('business'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'business'
                ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-5 w-5 mr-3" />
            Business Profile
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#45f3ff]/20 to-[#6f42c1]/10 text-white border-l-4 border-[#45f3ff]'
                : 'hover:bg-[#1a1a24] text-gray-400 hover:text-white'
            }`}
          >
            <UserIcon className="h-5 w-5 mr-3" />
            User Settings
          </button>
        </nav>

        <div className="pt-6 border-t border-gray-800">
          <button
            onClick={() => { logout(); setIsSidebarOpen(false); }}
            className="w-full flex items-center px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 z-10 overflow-y-auto print:hidden">
        <div className="max-w-4xl mx-auto">
          
          {/* -------------------- OPERATIONAL DASHBOARD OVERVIEW HUB -------------------- */}
          {activeTab === 'dashboard' && (() => {
            // Compute real-time aggregates
            const totalSales = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
            const totalPaidCollected = invoices.reduce((sum, i) => sum + (i.totalPaid || 0), 0);
            const totalExpensesSum = expenses.reduce((sum, e) => sum + e.amount, 0);
            const outstandingReceivables = invoices.reduce((sum, i) => sum + (i.outstandingBalance || 0), 0);
            const lowStockCount = products.filter(p => p.isLowStock).length;
            const netProfitSum = totalPaidCollected - totalExpensesSum;

            // Compute recent activities dynamically
            const recentActivities = [
              ...invoices.map(i => ({
                id: `inv-${i.id}`,
                type: 'invoice',
                date: new Date(i.createdAt || i.issueDate),
                title: `Invoice ${i.invoiceNumber}`,
                desc: `Created for ${i.customer.name}`,
                value: i.totalAmount,
                color: 'text-[#45f3ff] bg-[#45f3ff]/10 border-[#45f3ff]/20'
              })),
              ...expenses.map(e => ({
                id: `exp-${e.id}`,
                type: 'expense',
                date: new Date(e.createdAt || e.date),
                title: `Logged Expense`,
                desc: `${e.vendor} - ${e.category?.name || 'Miscellaneous'}`,
                value: e.amount,
                color: 'text-red-400 bg-red-500/10 border-red-500/20'
              })),
              ...invoices.filter(i => i.totalPaid > 0).map(i => ({
                id: `pmt-${i.id}`,
                type: 'payment',
                date: new Date(i.createdAt),
                title: `Recorded Payment`,
                desc: `Collection on ${i.invoiceNumber}`,
                value: i.totalPaid,
                color: 'text-[#86c232] bg-[#86c232]/10 border-[#86c232]/30'
              }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

            // Filter overdue invoices & low stock alerts
            const overdueList = invoices.filter(inv => inv.status === 'Overdue' || (inv.status === 'Sent' && new Date(inv.dueDate) < new Date() && inv.outstandingBalance > 0)).slice(0, 3);
            const lowStockList = products.filter(p => p.isLowStock).slice(0, 3);

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Onboarding Trigger Banner */}
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-[#45f3ff]" />
                    <div className="text-left">
                      <h4 className="font-bold text-white text-xs">New to Ops Suite?</h4>
                      <p className="text-[10px] text-gray-400">Launch our interactive system walk-through wizard or simulators anytime.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTourStep(1)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all shrink-0"
                  >
                    Start Guided Tour
                  </button>
                </div>

                {/* KPI cards across the top */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Revenue */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex items-center space-x-4 shadow-xl">
                    <div className="h-10 w-10 rounded-xl bg-[#86c232]/10 border border-[#86c232]/20 flex items-center justify-center text-[#86c232]">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cash Revenue</span>
                      <h3 className="text-xl font-black text-white mt-1">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalPaidCollected)}
                      </h3>
                    </div>
                  </div>

                  {/* Outstanding Invoices */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex items-center space-x-4 shadow-xl">
                    <div className="h-10 w-10 rounded-xl bg-[#45f3ff]/10 border border-[#45f3ff]/20 flex items-center justify-center text-[#45f3ff]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Unpaid Balances</span>
                      <h3 className="text-xl font-black text-white mt-1">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(outstandingReceivables)}
                      </h3>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex items-center space-x-4 shadow-xl">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Log Expenses</span>
                      <h3 className="text-xl font-black text-white mt-1">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalExpensesSum)}
                      </h3>
                    </div>
                  </div>

                  {/* Low Stock Warnings */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex items-center space-x-4 shadow-xl">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      lowStockCount > 0
                        ? 'bg-red-950/20 border-red-800 text-red-400 animate-pulse'
                        : 'bg-gray-800/40 border-gray-700 text-gray-400'
                    }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Low Stock SKUs</span>
                      <h3 className={`text-xl font-black mt-1 ${lowStockCount > 0 ? 'text-red-400' : 'text-white'}`}>
                        {lowStockCount}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Operations Charts Area */}
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
                  <div className="flex justify-between items-center border-b border-gray-800/80 pb-4 mb-6">
                    <div>
                      <h3 className="font-extrabold text-white text-md">Performance Analytics</h3>
                      <p className="text-[10px] text-gray-500">Real-time profit margins compared directly with cash collected vs overhead bills.</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        netProfitSum >= 0
                          ? 'bg-[#86c232]/10 text-[#86c232] border border-[#86c232]/25'
                          : 'bg-red-500/10 text-red-400 border border-red-500/25'
                      }`}>
                        Net: {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(netProfitSum)}
                      </span>
                    </div>
                  </div>

                  {/* HTML/CSS Bar Charts */}
                  <div className="space-y-6">
                    {/* Billed Sales Chart */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-400">Invoiced Billings vs Cash Collected</span>
                        <span className="text-white">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalPaidCollected)} / {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalSales)}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-gray-950/40 border border-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#45f3ff] to-[#86c232] rounded-full transition-all duration-500 shadow-[0_0_8px_#45f3ff]"
                          style={{ width: `${totalSales > 0 ? Math.min((totalPaidCollected / totalSales) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Expenses Chart */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-400">Overhead Expenses Ratio (of Revenue)</span>
                        <span className="text-white">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalExpensesSum)} ({totalPaidCollected > 0 ? ((totalExpensesSum / totalPaidCollected) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-gray-950/40 border border-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6f42c1] to-red-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#6f42c1]"
                          style={{ width: `${totalPaidCollected > 0 ? Math.min((totalExpensesSum / totalPaidCollected) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Profit Margin Chart */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-400">Net Profit Margin</span>
                        <span className={`font-bold ${netProfitSum >= 0 ? 'text-[#86c232]' : 'text-red-400'}`}>
                          {totalPaidCollected > 0 ? ((netProfitSum / totalPaidCollected) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-gray-950/40 border border-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 shadow-md ${
                            netProfitSum >= 0
                              ? 'bg-gradient-to-r from-[#86c232] to-emerald-400 shadow-[#86c232]/30'
                              : 'bg-red-500 shadow-red-500/30'
                          }`}
                          style={{ width: `${totalPaidCollected > 0 ? Math.max(0, Math.min((netProfitSum / totalPaidCollected) * 100, 100)) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Double column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Activity Feed Column */}
                  <div className="lg:col-span-2 bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-md border-b border-gray-800 pb-3 mb-4 uppercase tracking-wider font-mono">Recent Operations Feed</h3>
                      <div className="space-y-4">
                        {recentActivities.length === 0 ? (
                          <div className="text-center py-10 text-gray-500 text-xs">
                            No ledger entries found. Activities will display here as payments, invoices, and expenses are logged.
                          </div>
                        ) : (
                          recentActivities.map((act) => (
                            <div key={act.id} className="flex justify-between items-center text-xs border-b border-gray-800/20 pb-3 last:border-b-0">
                              <div className="flex items-center space-x-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border ${act.color}`}>
                                  {act.type === 'invoice' && 'INV'}
                                  {act.type === 'expense' && 'EXP'}
                                  {act.type === 'payment' && 'PMT'}
                                </div>
                                <div className="text-left min-w-0">
                                  <h4 className="font-bold text-white truncate">{act.title}</h4>
                                  <p className="text-[10px] text-gray-400 truncate">{act.desc}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-white">
                                  {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(act.value)}
                                </span>
                                <p className="text-[9px] text-gray-500 mt-0.5">{act.date.toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Critical Action Items Feed */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-6">
                    <div>
                      <h3 className="font-extrabold text-white text-md border-b border-gray-800 pb-3 mb-4 uppercase tracking-wider font-mono text-red-400 animate-pulse">Critical Alerts</h3>
                      <div className="space-y-4">
                        {/* Overdue Invoices Alerts */}
                        {overdueList.map((inv) => (
                          <div key={inv.id} className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl space-y-3 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-red-400 text-xs">{inv.invoiceNumber}</h4>
                                <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{inv.customer.name}</p>
                              </div>
                              <span className="text-[10px] font-bold text-red-400">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(inv.outstandingBalance)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500">Overdue: {new Date(inv.dueDate).toLocaleDateString()}</span>
                              <button
                                onClick={() => {
                                  setActiveTab('invoices');
                                  setSelectedInvoice(inv);
                                  handleOpenRecordPayment();
                                }}
                                className="px-2 py-1 bg-red-900/50 hover:bg-red-900 text-white rounded font-bold uppercase text-[9px] border border-red-800"
                              >
                                Pay
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Low Stock Alerts */}
                        {lowStockList.map((prod) => (
                          <div key={prod.id} className="p-3 bg-yellow-950/25 border border-yellow-900/40 rounded-xl space-y-3 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-yellow-500 text-xs">{prod.name}</h4>
                                <p className="text-[10px] text-gray-400 font-mono">{prod.sku}</p>
                              </div>
                              <span className="text-[10px] font-bold text-yellow-500">
                                {prod.quantity} / {prod.reorderLevel} {prod.unit || 'pcs'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500">Stock Reorder Warning</span>
                              <button
                                onClick={(e) => {
                                  setActiveTab('inventory');
                                  const dummyEvent = { stopPropagation: () => {} } as any;
                                  handleOpenAdjustStock(prod, dummyEvent);
                                }}
                                className="px-2 py-1 bg-yellow-950/50 hover:bg-yellow-900 text-white rounded font-bold uppercase text-[9px] border border-yellow-800"
                              >
                                Restock
                              </button>
                            </div>
                          </div>
                        ))}

                        {overdueList.length === 0 && lowStockList.length === 0 && (
                          <div className="text-center py-12 text-gray-500 text-xs">
                            No critical alerts. All accounts are paid up and stock levels are stable!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* -------------------- INVENTORY & PRODUCTS TAB VIEW -------------------- */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Inventory Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Products Tracked</span>
                  <span className="text-3xl font-black text-[#45f3ff] mt-3">
                    {products.length}
                  </span>
                </div>

                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Asset/Inventory Valuation</span>
                  <span className="text-3xl font-black text-white mt-3">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                      products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0)
                    )}
                  </span>
                </div>

                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Low Stock Alerts</span>
                  <span className={`text-3xl font-black mt-3 ${
                    products.filter(p => p.isLowStock).length > 0 ? 'text-red-400 animate-pulse' : 'text-gray-500'
                  }`}>
                    {products.filter(p => p.isLowStock).length}
                  </span>
                </div>
              </div>

              {/* Filters & Actions row */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
                  {/* Search Product SKU / Name */}
                  <div className="relative w-full sm:w-60">
                    <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setProductCurrentPage(1);
                      }}
                      placeholder="Search SKU or name..."
                      className="pl-9 pr-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                    />
                  </div>

                  {/* Filter Low Stock Checkbox */}
                  <label className="flex items-center text-xs text-gray-400 cursor-pointer shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={productLowStockFilter}
                      onChange={(e) => {
                        setProductLowStockFilter(e.target.checked);
                        setProductCurrentPage(1);
                      }}
                      className="h-4 w-4 bg-[#0f0f15]/80 border-gray-800 rounded text-[#45f3ff] focus:ring-[#45f3ff] mr-2"
                    />
                    Low Stock Only
                  </label>

                  {/* Sorting dropdown */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-gray-500">Sort:</span>
                    <select
                      value={productSortField}
                      onChange={(e) => setProductSortField(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="name">Product Name</option>
                      <option value="sku">SKU Code</option>
                      <option value="sellingPrice">Selling Price</option>
                      <option value="costPrice">Cost Price</option>
                      <option value="quantity">Stock Quantity</option>
                    </select>
                    <select
                      value={productSortOrder}
                      onChange={(e) => setProductSortOrder(e.target.value as 'asc' | 'desc')}
                      className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleExportProducts}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                    title="Export Catalog as CSV file"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </button>
                  {hasPermission(user, 'manage:inventory') && (
                    <button
                      onClick={() => { setCsvImportType('products'); setIsCsvImportOpen(true); }}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                      title="Import Catalog from CSV file"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Import CSV
                    </button>
                  )}
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Product Listing Table */}
              <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                {loadingProducts ? (
                  <div className="flex flex-col items-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
                    <p className="mt-4 text-sm text-gray-400">Loading inventory catalog...</p>
                  </div>
                ) : processedProducts.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <Package className="h-12 w-12 text-gray-600 mx-auto" />
                    <h3 className="font-bold text-white text-lg">No Products Found</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                      Adjust your search filters or register a new product catalog item to populate your inventory ledger.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                          <th className="py-4 px-6">SKU Code</th>
                          <th className="py-4 px-6">Product Name</th>
                          <th className="py-4 px-6">Unit Price</th>
                          <th className="py-4 px-6">Stock Level</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                        {paginatedProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-[#1f2833]/30 transition-colors">
                            <td className="py-4 px-6 font-mono text-xs font-bold text-[#45f3ff]">
                              {prod.sku}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white">
                              <div>{prod.name}</div>
                              {prod.description && (
                                <div className="text-[10px] text-gray-500 font-normal truncate max-w-[200px]" title={prod.description}>
                                  {prod.description}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white text-xs">
                              <div className="font-bold text-white">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(prod.sellingPrice)}
                              </div>
                              <div className="text-[10px] text-gray-500 font-normal">
                                Cost: {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(prod.costPrice)}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-bold text-white">
                              {prod.quantity} <span className="text-[10px] font-normal text-gray-500">{prod.unit || 'pcs'} / Limit: {prod.reorderLevel}</span>
                            </td>
                            <td className="py-4 px-6">
                              {prod.quantity === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/25 border border-red-900/50 text-red-400">
                                  Out of stock
                                </span>
                              ) : prod.isLowStock ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-950/25 border border-yellow-900/50 text-yellow-500 animate-pulse">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/25 border border-emerald-900/50 text-[#86c232]">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right text-xs">
                              <div className="inline-flex items-center space-x-2">
                                {hasPermission(user, 'manage:inventory') && (
                                  <button
                                    onClick={(e) => handleOpenAdjustStock(prod, e)}
                                    className="px-2 py-1.5 bg-[#45f3ff]/10 text-[#45f3ff] hover:bg-[#45f3ff]/20 rounded border border-[#45f3ff]/20 font-bold uppercase text-[10px]"
                                    title="Adjust Stock"
                                  >
                                    Adjust
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleOpenLedger(prod, e)}
                                  className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700"
                                  title="View Transaction Logs"
                                >
                                  <History className="h-3.5 w-3.5" />
                                </button>
                                {hasPermission(user, 'manage:inventory') && (
                                  <>
                                    <button
                                      onClick={(e) => handleOpenEditProduct(prod, e)}
                                      className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700"
                                      title="Edit Product Details"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteProduct(prod.id, e)}
                                      className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800/60 text-xs">
                      <span className="text-gray-500">
                        Showing {Math.min(processedProducts.length, (productCurrentPage - 1) * productItemsPerPage + 1)} to {Math.min(processedProducts.length, productCurrentPage * productItemsPerPage)} of {processedProducts.length} entries
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          disabled={productCurrentPage === 1}
                          onClick={() => setProductCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Prev
                        </button>
                        {[...Array(productTotalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setProductCurrentPage(i + 1)}
                            className={`px-3 py-1.5 rounded font-bold ${
                              productCurrentPage === i + 1
                                ? 'bg-[#45f3ff] text-[#0b0c10]'
                                : 'bg-[#0f0f15]/80 text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          disabled={productCurrentPage === productTotalPages}
                          onClick={() => setProductCurrentPage(prev => Math.min(prev + 1, productTotalPages))}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add/Edit Product Modal Form */}
              {isProductFormOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-md">
                        {editingProduct ? 'Edit Product Parameters' : 'Register New Product'}
                      </h3>
                      <button onClick={() => setIsProductFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                      {productFormError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {productFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">SKU Code</label>
                          <input
                            type="text"
                            required
                            value={productFormSku}
                            onChange={(e) => setProductFormSku(e.target.value)}
                            placeholder="SKU"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs font-mono uppercase"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Product Name</label>
                          <input
                            type="text"
                            required
                            value={productFormName}
                            onChange={(e) => setProductFormName(e.target.value)}
                            placeholder="e.g. Consulting Hour, SaaS License"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Selling Price</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={productFormUnitPrice}
                            onChange={(e) => setProductFormUnitPrice(e.target.value)}
                            placeholder="0.00"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs text-right"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Cost Price</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={productFormCostPrice}
                            onChange={(e) => setProductFormCostPrice(e.target.value)}
                            placeholder="0.00"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs text-right"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Unit</label>
                          <input
                            type="text"
                            required
                            value={productFormUnit}
                            onChange={(e) => setProductFormUnit(e.target.value)}
                            placeholder="pcs"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Low Threshold</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={productFormThreshold}
                            onChange={(e) => setProductFormThreshold(e.target.value)}
                            placeholder="5"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs text-right"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                            {editingProduct ? 'Current Stock' : 'Initial Stock'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={productFormInitialStock}
                            onChange={(e) => setProductFormInitialStock(e.target.value)}
                            placeholder="0"
                            disabled={!!editingProduct}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-sm text-right disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Description</label>
                        <textarea
                          rows={3}
                          value={productFormDescription}
                          onChange={(e) => setProductFormDescription(e.target.value)}
                          placeholder="Provide details about size, capabilities, license parameters..."
                          className="mt-2 block w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none text-xs"
                        />
                      </div>

                      <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsProductFormOpen(false)}
                          className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={productFormSubmitting}
                          className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                        >
                          {productFormSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Save Product'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Adjust Stock Form Modal */}
              {isAdjustmentFormOpen && adjustingProduct && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <div>
                        <h3 className="font-extrabold text-white text-md">Adjust Stock Level</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">{adjustingProduct.name} ({adjustingProduct.sku})</p>
                      </div>
                      <button onClick={() => setIsAdjustmentFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
                      {adjustmentError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {adjustmentError}
                        </div>
                      )}

                      <div className="flex items-center justify-between bg-black/25 border border-gray-800 p-3 rounded-lg text-xs">
                        <span className="text-gray-500 font-semibold uppercase font-mono">Current Stock:</span>
                        <span className="text-[#86c232] font-extrabold text-sm">{adjustingProduct.quantity} {adjustingProduct.unit || 'pcs'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Adjustment Type</label>
                          <select
                            value={adjustmentType}
                            onChange={(e) => setAdjustmentType(e.target.value)}
                            required
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs"
                          >
                            <option value="Purchase">Purchase (Stock In)</option>
                            <option value="Return">Return (Stock In)</option>
                            <option value="Adjustment_Add">Adjustment (Stock In)</option>
                            <option value="Sale">Sale (Stock Out)</option>
                            <option value="Adjustment_Deduct">Adjustment (Stock Out)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Quantity</label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={adjustmentQuantity}
                            onChange={(e) => setAdjustmentQuantity(e.target.value)}
                            placeholder="0"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-sm text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Notes / Reason</label>
                        <textarea
                          rows={2}
                          value={adjustmentNotes}
                          onChange={(e) => setAdjustmentNotes(e.target.value)}
                          placeholder="Specify receipt reference, supplier order details, or adjustment reason..."
                          className="mt-2 block w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none text-xs"
                        />
                      </div>

                      <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsAdjustmentFormOpen(false)}
                          className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={adjustmentSubmitting}
                          className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                        >
                          {adjustmentSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Log Transaction'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Transaction Ledger History Modal */}
              {isLedgerOpen && ledgerProduct && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <div>
                        <h3 className="font-extrabold text-white text-md">Stock Ledger History</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">{ledgerProduct.name} ({ledgerProduct.sku})</p>
                      </div>
                      <button onClick={() => setIsLedgerOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      {loadingLedger ? (
                        <div className="flex flex-col items-center py-12">
                          <Loader2 className="animate-spin h-8 w-8 text-[#45f3ff]" />
                          <p className="mt-4 text-xs text-gray-400">Loading transactional logs...</p>
                        </div>
                      ) : ledgerTransactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xs italic uppercase tracking-wider">
                          No transactions recorded for this product.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase tracking-wider pb-2">
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Type</th>
                                <th className="pb-2 text-right">Quantity Change</th>
                                <th className="pb-2 pl-4">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                              {ledgerTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-black/10">
                                  <td className="py-2.5 text-gray-400 whitespace-nowrap">
                                    {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`inline-flex px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold uppercase ${
                                      tx.type === 'Purchase' || tx.type === 'Return'
                                        ? 'bg-emerald-950/20 text-[#86c232]'
                                        : tx.type === 'Sale'
                                        ? 'bg-red-950/20 text-red-400'
                                        : 'bg-blue-950/20 text-[#45f3ff]'
                                    }`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className={`py-2.5 text-right font-bold ${tx.quantity >= 0 ? 'text-[#86c232]' : 'text-red-400'}`}>
                                    {tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity}
                                  </td>
                                  <td className="py-2.5 pl-4 text-gray-400 italic max-w-[150px] truncate" title={tx.notes || ''}>
                                    {tx.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -------------------- EXPENSES TAB VIEW -------------------- */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue (Payments)</span>
                  <span className="text-3xl font-black text-[#86c232] mt-3">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                      invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0)
                    )}
                  </span>
                </div>

                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Expenses</span>
                  <span className="text-3xl font-black text-red-400 mt-3">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                      expenses.reduce((sum, exp) => sum + exp.amount, 0)
                    )}
                  </span>
                </div>

                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Cashflow</span>
                  <span className={`text-3xl font-black mt-3 ${
                    invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0) - expenses.reduce((sum, exp) => sum + exp.amount, 0) >= 0
                      ? 'text-[#45f3ff]'
                      : 'text-red-500'
                  }`}>
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                      invoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0) - expenses.reduce((sum, exp) => sum + exp.amount, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Expense Distribution Visual Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* SVG Donut Chart Card */}
                <div className="md:col-span-2 bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-center items-center">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Category Spending Chart</h3>
                  
                  {expenses.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      No data to chart
                    </div>
                  ) : (() => {
                    const stats = getCategoryStats();
                    let accumulatedOffset = 0;
                    return (
                      <div className="relative">
                        <svg viewBox="0 0 100 100" className="w-44 h-44">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#101015"
                            strokeWidth="8"
                          />
                          {stats.statsList.map((item) => {
                            const dashArray = 251.3;
                            const currentRotation = accumulatedOffset;
                            accumulatedOffset += (item.percentage / 100) * 360;
                            return (
                              <circle
                                key={item.id}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="8"
                                strokeDasharray={`${(item.percentage / 100) * dashArray} ${dashArray}`}
                                strokeDashoffset={0}
                                transform={`rotate(${currentRotation - 90} 50 50)`}
                                className="transition-all duration-500 ease-out"
                              />
                            );
                          })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center leading-tight">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">TOTAL SPENT</span>
                          <span className="text-md font-black text-white mt-1">
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(stats.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Progress bars list */}
                <div className="md:col-span-3 bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Spend Distribution List</h3>
                  
                  {expenses.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Record expenses to visualize breakdowns
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[190px] overflow-y-auto pr-1">
                      {getCategoryStats().statsList.map((item) => (
                        <div key={item.id} className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-semibold text-gray-300">
                            <span className="truncate pr-2">{item.name}</span>
                            <div className="shrink-0 space-x-2">
                              <span className="text-white">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.amount)}</span>
                              <span className="text-gray-500">({item.percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          {/* Colored Progress Bar */}
                          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filters & Actions row */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                  {/* Search Vendor */}
                  <div className="relative w-full sm:w-60">
                    <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={expenseSearch}
                      onChange={(e) => {
                        setExpenseSearch(e.target.value);
                        setExpenseCurrentPage(1);
                      }}
                      placeholder="Search vendor / notes..."
                      className="pl-9 pr-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                    />
                  </div>

                  {/* Filter Category */}
                  <select
                    value={expenseFilterCategory}
                    onChange={(e) => {
                      setExpenseFilterCategory(e.target.value);
                      setExpenseCurrentPage(1);
                    }}
                    className="px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full sm:w-44"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} {c.disabled ? '(Disabled)' : ''}</option>
                    ))}
                  </select>

                  {/* Sorting controls */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-gray-500">Sort:</span>
                    <select
                      value={expenseSortField}
                      onChange={(e) => setExpenseSortField(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="date">Date</option>
                      <option value="vendor">Vendor</option>
                      <option value="amount">Amount</option>
                      <option value="category">Category</option>
                    </select>
                    <select
                      value={expenseSortOrder}
                      onChange={(e) => setExpenseSortOrder(e.target.value as 'asc' | 'desc')}
                      className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleExportExpenses}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                    title="Export Expenses as CSV file"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </button>
                  <button
                    onClick={() => setIsCategoryManagerOpen(true)}
                    className="px-4 py-2 border border-gray-700 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    Manage Categories
                  </button>
                  <button
                    onClick={handleOpenAddExpense}
                    className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Expense
                  </button>
                </div>
              </div>

              {/* Expense Table Panel */}
              <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                {loadingExpenses ? (
                  <div className="flex flex-col items-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
                    <p className="mt-4 text-sm text-gray-400">Loading expenses...</p>
                  </div>
                ) : processedExpenses.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <TrendingUp className="h-12 w-12 text-gray-600 mx-auto" />
                    <h3 className="font-bold text-white text-lg">No Expense Records Found</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                      Adjust your search terms, select another category, or log a new business expense record.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Vendor</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Notes</th>
                          <th className="py-4 px-6">Receipt</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
                        {paginatedExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-[#1f2833]/30 transition-colors">
                            <td className="py-4 px-6 whitespace-nowrap text-gray-400">
                              {new Date(exp.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 font-bold text-white">
                              {exp.vendor}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/40 border border-gray-800 text-gray-300">
                                {exp.category?.name || 'Category'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-gray-400 max-w-[200px] truncate" title={exp.notes || ''}>
                              {exp.notes || <span className="text-gray-600 italic">No notes</span>}
                            </td>
                            <td className="py-4 px-6">
                              {exp.receiptUrl ? (
                                <a
                                  href={exp.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs text-[#45f3ff] hover:underline"
                                >
                                  View Receipt
                                </a>
                              ) : (
                                <span className="text-gray-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-white">
                              {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(exp.amount)}
                            </td>
                            <td className="py-4 px-6 text-right text-xs">
                              <div className="inline-flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleOpenEditExpense(exp, e)}
                                  className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700"
                                  title="Edit Expense"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteExpense(exp.id, e)}
                                  className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800/60 text-xs">
                      <span className="text-gray-500">
                        Showing {Math.min(processedExpenses.length, (expenseCurrentPage - 1) * expenseItemsPerPage + 1)} to {Math.min(processedExpenses.length, expenseCurrentPage * expenseItemsPerPage)} of {processedExpenses.length} entries
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          disabled={expenseCurrentPage === 1}
                          onClick={() => setExpenseCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Prev
                        </button>
                        {[...Array(expenseTotalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setExpenseCurrentPage(i + 1)}
                            className={`px-3 py-1.5 rounded font-bold ${
                              expenseCurrentPage === i + 1
                                ? 'bg-[#45f3ff] text-[#0b0c10]'
                                : 'bg-[#0f0f15]/80 text-gray-400 hover:bg-gray-800'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          disabled={expenseCurrentPage === expenseTotalPages}
                          onClick={() => setExpenseCurrentPage(prev => Math.min(prev + 1, expenseTotalPages))}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add/Edit Expense Form Modal */}
              {isExpenseFormOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-md">
                        {editingExpense ? 'Edit Expense Record' : 'Log Business Expense'}
                      </h3>
                      <button onClick={() => setIsExpenseFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                      {expenseFormError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {expenseFormError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Vendor Name</label>
                        <input
                          type="text"
                          required
                          value={expenseVendor}
                          onChange={(e) => setExpenseVendor(e.target.value)}
                          placeholder="e.g. AWS, Office Depot, Landlord"
                          className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Category</label>
                          <select
                            value={expenseCategoryId}
                            onChange={(e) => setExpenseCategoryId(e.target.value)}
                            required
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-xs"
                          >
                            <option value="" disabled>Select...</option>
                            {/* Only list active categories, or the currently selected category if it was disabled */}
                            {categories
                              .filter(c => !c.disabled || c.id === expenseCategoryId)
                              .map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))
                            }
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Amount</label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            placeholder="0.00"
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-right text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Expense Date</label>
                          <input
                            type="date"
                            required
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] text-sm"
                          />
                        </div>
                      </div>

                      {/* Receipt upload */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono mb-2">Receipt Attachment</label>
                        <div className="flex items-center space-x-3 bg-black/20 border border-gray-800 p-3 rounded-lg">
                          <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors shrink-0">
                            <Upload className="h-3.5 w-3.5 mr-2 text-[#45f3ff]" />
                            Attach File
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleReceiptUpload}
                              disabled={receiptUploading}
                            />
                          </label>
                          <div className="min-w-0 flex-1 text-xs">
                            {receiptUploading ? (
                              <span className="text-gray-400 flex items-center"><Loader2 className="animate-spin h-3.5 w-3.5 mr-1 text-[#45f3ff]" /> Uploading...</span>
                            ) : expenseReceiptUrl ? (
                              <span className="text-[#86c232] truncate block font-semibold flex items-center">
                                <Check className="h-3.5 w-3.5 mr-1" /> Attached Receipt
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">No receipt attached</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Notes</label>
                        <textarea
                          rows={2}
                          value={expenseNotes}
                          onChange={(e) => setExpenseNotes(e.target.value)}
                          placeholder="Payment details, invoice numbers, description..."
                          className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none text-xs"
                        />
                      </div>

                      <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsExpenseFormOpen(false)}
                          className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={expenseFormSubmitting || receiptUploading}
                          className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                        >
                          {expenseFormSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Save Expense'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Category Manager Modal */}
              {isCategoryManagerOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-md">Expense Category Manager</h3>
                      <button onClick={() => setIsCategoryManagerOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Create Custom Category Form */}
                      <form onSubmit={handleCategoryCreate} className="space-y-3 bg-black/20 border border-gray-800 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Create Custom Category</h4>
                        {categoryFormError && (
                          <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-xs flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {categoryFormError}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={categoryFormName}
                            onChange={(e) => setCategoryFormName(e.target.value)}
                            placeholder="Category name (e.g. Legal Consulting)"
                            className="flex-1 px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={categoryFormSubmitting}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </form>

                      {/* Categories List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-gray-800 pb-2">Active Categories</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {categories.map((cat) => {
                            // Check if standard system default category
                            const systemDefaults = [
                              'Rent & Lease',
                              'Utilities (Electricity, Water, Internet, Phone)',
                              'Salaries & Wages',
                              'Marketing & Advertising',
                              'Travel & Lodging',
                              'Office Supplies',
                              'Software & Subscriptions',
                              'Fuel & Vehicle',
                              'Inventory / Cost of Goods Sold (COGS)',
                              'Equipment & Maintenance',
                              'Professional Services (Legal, Accounting, Consulting)',
                              'Insurance',
                              'Bank Fees & Charges',
                              'Taxes & Licenses',
                              'Other / Miscellaneous'
                            ];
                            const isSystemDefault = systemDefaults.includes(cat.name);

                            return (
                              <div key={cat.id} className="flex items-center justify-between bg-[#0f0f15]/50 border border-gray-800/80 px-4 py-2.5 rounded-lg text-xs">
                                <div>
                                  <span className={`font-semibold ${cat.disabled ? 'text-gray-600 line-through' : 'text-white'}`}>
                                    {cat.name}
                                  </span>
                                  {isSystemDefault && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[9px] font-bold uppercase">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  {/* Toggle Disable/Enable category button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCategoryDisable(cat)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border ${
                                      cat.disabled
                                        ? 'bg-[#86c232]/10 border-[#86c232]/25 text-[#86c232] hover:bg-[#86c232]/20'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                                    }`}
                                    title={cat.disabled ? 'Enable Category' : 'Disable Category'}
                                  >
                                    {cat.disabled ? 'Enable' : 'Disable'}
                                  </button>
                                  {/* Custom categories can be deleted if not in use */}
                                  {!isSystemDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30"
                                      title="Delete Custom Category"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -------------------- INVOICES TAB VIEW -------------------- */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {!selectedInvoice ? (
                // View 1: Invoices List View
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white">Billing & Invoicing</h2>
                      <p className="mt-1 text-sm text-gray-400">Generate bills, record payment transactions, check balances, and view aging status.</p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      {hasPermission(user, 'manage:invoices') && (
                        <button
                          onClick={handleOpenAddInvoice}
                          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Create Invoice
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                      <div className="relative w-full sm:w-60">
                        <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={invoiceSearch}
                          onChange={(e) => {
                            setInvoiceSearch(e.target.value);
                            setInvoiceCurrentPage(1);
                          }}
                          placeholder="Search invoice # or customer..."
                          className="pl-9 pr-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                        />
                      </div>

                      <select
                        value={invoiceFilterStatus}
                        onChange={(e) => {
                          setInvoiceFilterStatus(e.target.value);
                          setInvoiceCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full sm:w-40"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs text-gray-500">Sort:</span>
                        <select
                          value={invoiceSortField}
                          onChange={(e) => setInvoiceSortField(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="issueDate">Issue Date</option>
                          <option value="invoiceNumber">Invoice Number</option>
                          <option value="totalAmount">Total Amount</option>
                          <option value="dueDate">Due Date</option>
                          <option value="customer">Customer Name</option>
                        </select>
                        <select
                          value={invoiceSortOrder}
                          onChange={(e) => setInvoiceSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <button
                        onClick={handleExportInvoices}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                        title="Export Invoices as CSV file"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Invoices List Table */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    {loadingInvoices ? (
                      <div className="flex flex-col items-center py-20">
                        <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
                        <p className="mt-4 text-sm text-gray-400">Loading invoices...</p>
                      </div>
                    ) : processedInvoices.length === 0 ? (
                      <div className="text-center py-20 space-y-4">
                        <Receipt className="h-12 w-12 text-gray-600 mx-auto" />
                        <h3 className="font-bold text-white text-lg">No Invoices Found</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                          Adjust your status or query filters, or create a new invoice to start billing.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                              <th className="py-4 px-6">Invoice #</th>
                              <th className="py-4 px-6">Customer</th>
                              <th className="py-4 px-6">Due Date</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Total</th>
                              <th className="py-4 px-6 text-right">Balance</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60">
                            {paginatedInvoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                onClick={() => loadInvoiceDetails(invoice)}
                                className="group hover:bg-[#1f2833]/30 cursor-pointer transition-colors duration-150"
                              >
                                <td className="py-4 px-6">
                                  <span className="font-bold text-white group-hover:text-[#45f3ff] transition-colors">
                                    {invoice.invoiceNumber}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-300">
                                  {invoice.customer.name}
                                  {invoice.customer.businessName && (
                                    <span className="block text-[10px] text-gray-500">{invoice.customer.businessName}</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-400">
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    invoice.status === 'Paid'
                                      ? 'bg-[#86c232]/10 text-[#86c232] border border-[#86c232]/30'
                                      : invoice.status === 'Partially Paid'
                                      ? 'bg-[#6f42c1]/10 text-[#6f42c1] border border-[#6f42c1]/30'
                                      : invoice.status === 'Sent'
                                      ? 'bg-[#45f3ff]/10 text-[#45f3ff] border border-[#45f3ff]/30'
                                      : invoice.status === 'Overdue'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                                  }`}>
                                    {invoice.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right font-semibold text-white">
                                  {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(invoice.totalAmount)}
                                </td>
                                <td className={`py-4 px-6 text-right font-semibold ${invoice.outstandingBalance > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                  {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(invoice.outstandingBalance)}
                                </td>
                                <td className="py-4 px-6 text-right text-xs">
                                  <div className="inline-flex items-center space-x-2">
                                    <button
                                      onClick={(e) => handleOpenEditInvoice(invoice, e)}
                                      className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700 hover:border-gray-600"
                                      title="Edit Invoice"
                                      disabled={invoice.status === 'Paid'}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteInvoice(invoice.id, e)}
                                      className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30 hover:border-red-900/50"
                                      title="Delete Invoice"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800/60 text-xs">
                          <span className="text-gray-500">
                            Showing {Math.min(processedInvoices.length, (invoiceCurrentPage - 1) * invoiceItemsPerPage + 1)} to {Math.min(processedInvoices.length, invoiceCurrentPage * invoiceItemsPerPage)} of {processedInvoices.length} entries
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              disabled={invoiceCurrentPage === 1}
                              onClick={(e) => { e.stopPropagation(); setInvoiceCurrentPage(prev => Math.max(prev - 1, 1)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Prev
                            </button>
                            {[...Array(invoiceTotalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setInvoiceCurrentPage(i + 1); }}
                                className={`px-3 py-1.5 rounded font-bold ${
                                  invoiceCurrentPage === i + 1
                                    ? 'bg-[#45f3ff] text-[#0b0c10]'
                                    : 'bg-[#0f0f15]/80 text-gray-400 hover:bg-gray-800'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              disabled={invoiceCurrentPage === invoiceTotalPages}
                              onClick={(e) => { e.stopPropagation(); setInvoiceCurrentPage(prev => Math.min(prev + 1, invoiceTotalPages)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // View 2: Invoice Details, Payments history & Record payment forms
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-5">
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                      }}
                      className="inline-flex items-center text-sm font-semibold text-[#45f3ff] hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      Back to Invoices
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setPrintingInvoice(selectedInvoice)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Print / PDF
                      </button>

                      {selectedInvoice.status !== 'Paid' && (
                        <button
                          onClick={handleOpenRecordPayment}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#86c232] hover:bg-[#86c232]/80 transition-colors"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Record Payment
                        </button>
                      )}

                      {selectedInvoice.status !== 'Paid' ? (
                        <button
                          onClick={(e) => handleOpenEditInvoice(selectedInvoice, e)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit Invoice
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-[#86c232] bg-[#86c232]/10 border border-[#86c232]/30">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Paid in Full
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Invoice items layout */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-800/80 pb-6 gap-4">
                          <div>
                            <h3 className="font-extrabold text-white text-2xl">{selectedInvoice.invoiceNumber}</h3>
                            <p className="text-xs text-gray-400 mt-1">Invoice document details</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase ${
                              selectedInvoice.status === 'Paid'
                                ? 'bg-[#86c232]/10 text-[#86c232] border border-[#86c232]/30'
                                : selectedInvoice.status === 'Partially Paid'
                                ? 'bg-[#6f42c1]/10 text-[#6f42c1] border border-[#6f42c1]/30'
                                : selectedInvoice.status === 'Sent'
                                ? 'bg-[#45f3ff]/10 text-[#45f3ff] border border-[#45f3ff]/30'
                                : selectedInvoice.status === 'Overdue'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                              {selectedInvoice.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                              Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Customer and billing info */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-1">From</h4>
                            <p className="font-bold text-white">{companyName}</p>
                            <p className="text-gray-400 whitespace-pre-line mt-0.5">{address}</p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-500 uppercase tracking-wider mb-1">Bill To</h4>
                            <p className="font-bold text-white">{selectedInvoice.customer.name}</p>
                            {selectedInvoice.customer.businessName && <p className="text-[#45f3ff]">{selectedInvoice.customer.businessName}</p>}
                            {selectedInvoice.customer.address && <p className="text-gray-400 whitespace-pre-line mt-0.5">{selectedInvoice.customer.address}</p>}
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-gray-800 rounded-xl overflow-hidden mt-6">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-gray-800 bg-black/40 text-xs font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4 text-center">Qty</th>
                                <th className="py-3 px-4 text-right">Unit Price</th>
                                <th className="py-3 px-4 text-right">Tax %</th>
                                <th className="py-3 px-4 text-right">Disc %</th>
                                <th className="py-3 px-4 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60 text-gray-300">
                              {selectedInvoice.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-800/20">
                                  <td className="py-3 px-4 font-semibold text-white">{item.description}</td>
                                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                                  <td className="py-3 px-4 text-right">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.unitPrice)}
                                  </td>
                                  <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                                  <td className="py-3 px-4 text-right">{item.discountRate}%</td>
                                  <td className="py-3 px-4 text-right font-bold text-white">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals Summary */}
                        <div className="flex justify-end pt-4 border-t border-gray-800/80">
                          <div className="w-64 space-y-2 text-sm text-gray-400">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="text-white">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                                  selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                                )}
                              </span>
                            </div>
                            {selectedInvoice.discountAmount > 0 && (
                              <div className="flex justify-between text-red-400">
                                  <span>Discount:</span>
                                  <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedInvoice.discountAmount)}</span>
                              </div>
                            )}
                            {selectedInvoice.taxAmount > 0 && (
                              <div className="flex justify-between text-gray-400">
                                  <span>Tax Amount:</span>
                                  <span className="text-white">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedInvoice.taxAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-gray-800 pt-2 text-base font-black text-white">
                              <span>Total Invoiced:</span>
                              <span className="text-[#45f3ff]">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedInvoice.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Total Paid:</span>
                              <span className="text-[#86c232] font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedInvoice.totalPaid)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-800 pt-1 font-bold text-white">
                              <span>Outstanding Balance:</span>
                              <span className="text-red-400">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedInvoice.outstandingBalance)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {selectedInvoice.notes && (
                          <div className="border-t border-gray-800/80 pt-6 space-y-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Invoice Terms & Notes</h5>
                            <p className="text-xs text-gray-300 bg-black/40 border border-gray-800 p-4 rounded-xl whitespace-pre-line leading-relaxed">
                              {selectedInvoice.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payments History log column */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                        <h4 className="font-bold text-white text-md flex items-center border-b border-gray-800 pb-3">
                          <History className="h-5 w-5 mr-2 text-[#86c232]" />
                          Payments History
                        </h4>

                        {selectedInvoice.payments.length === 0 ? (
                          <div className="text-center py-10 bg-black/20 border border-gray-800 rounded-xl">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">No payments recorded</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {selectedInvoice.payments.map((payment) => (
                              <div key={payment.id} className="bg-black/35 border border-gray-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-black text-white">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(payment.amount)}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-[#86c232]/10 border border-[#86c232]/25 text-[#86c232] rounded font-bold uppercase text-[9px]">
                                    {payment.method}
                                  </span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Date: {new Date(payment.date).toLocaleDateString()}</span>
                                </div>
                                {payment.notes && (
                                  <p className="text-gray-500 border-t border-gray-800/60 pt-1.5 leading-relaxed italic">
                                    &ldquo;{payment.notes}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add/Edit Invoice slide-over */}
              {isInvoiceFormOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-lg">
                        {editingInvoice ? `Edit Invoice ${editingInvoice.invoiceNumber}` : 'Create New Invoice'}
                      </h3>
                      <button onClick={() => setIsInvoiceFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleInvoiceSubmit} className="p-6 space-y-6">
                      {invoiceFormError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {invoiceFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Select Customer</label>
                          <select
                            value={invoiceCustomerId}
                            onChange={(e) => setInvoiceCustomerId(e.target.value)}
                            required
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          >
                            <option value="" disabled>Choose customer...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Issue Date</label>
                          <input
                            type="date"
                            required
                            value={invoiceIssueDate}
                            onChange={(e) => setInvoiceIssueDate(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Due Date</label>
                          <input
                            type="date"
                            required
                            value={invoiceDueDate}
                            onChange={(e) => setInvoiceDueDate(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                          <h4 className="text-sm font-bold text-white">Invoice Items</h4>
                          <button
                            type="button"
                            onClick={handleAddInvoiceLineItem}
                            className="inline-flex items-center text-xs font-bold text-[#45f3ff] hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Row
                          </button>
                        </div>

                        <div className="space-y-3">
                          {invoiceItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-black/25 border border-gray-800/80 p-4 rounded-xl relative group animate-none">
                              <div className="flex-1 w-full">
                                <input
                                  type="text"
                                  placeholder="Description"
                                  required
                                  value={item.description}
                                  onChange={(e) => handleInvoiceLineItemChange(index, 'description', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleInvoiceLineItemChange(index, 'quantity', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-32">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  required
                                  value={item.unitPrice}
                                  onChange={(e) => handleInvoiceLineItemChange(index, 'unitPrice', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-right text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  value={item.taxRate}
                                  onChange={(e) => handleInvoiceLineItemChange(index, 'taxRate', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  value={item.discountRate}
                                  onChange={(e) => handleInvoiceLineItemChange(index, 'discountRate', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-32 text-right py-2 text-sm font-bold text-white pr-2">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceLineItem(index)}
                                disabled={invoiceItems.length === 1}
                                className="p-2 text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Notes</label>
                          <textarea
                            rows={4}
                            value={invoiceNotes}
                            onChange={(e) => setInvoiceNotes(e.target.value)}
                            placeholder="Add bank accounts, terms, notes..."
                            className="mt-2 block w-full px-4 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none text-sm"
                          />
                        </div>

                        <div className="bg-black/30 border border-gray-800 rounded-xl p-5 flex flex-col justify-center space-y-3">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal:</span>
                            <span className="text-white font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getInvoiceTotals().subtotal)}</span>
                          </div>
                          {getInvoiceTotals().discount > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                              <span>Discount:</span>
                              <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getInvoiceTotals().discount)}</span>
                            </div>
                          )}
                          {getInvoiceTotals().tax > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                              <span>Tax:</span>
                              <span className="text-white font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getInvoiceTotals().tax)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-gray-800 pt-3 text-lg font-black text-white">
                            <span>Total Amount:</span>
                            <span className="text-[#45f3ff]">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getInvoiceTotals().grandTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsInvoiceFormOpen(false)}
                          className="px-4 py-2.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          onClick={() => setInvoiceStatus('Draft')}
                          disabled={invoiceFormSubmitting}
                          className="px-4 py-2.5 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 bg-gray-900/60"
                        >
                          Save as Draft
                        </button>
                        <button
                          type="submit"
                          onClick={() => setInvoiceStatus('Sent')}
                          disabled={invoiceFormSubmitting}
                          className="px-5 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7]"
                        >
                          {invoiceFormSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Save & Issue Invoice'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Record Payment Form Modal */}
              {isPaymentFormOpen && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-md">Record Payment Transaction</h3>
                      <button onClick={() => setIsPaymentFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                      {paymentError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {paymentError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Payment Amount</label>
                        <div className="mt-2 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">$</span>
                          </div>
                          <input
                            type="number"
                            step="any"
                            required
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="block w-full pl-8 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Payment Date</label>
                        <input
                          type="date"
                          required
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Check">Check</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Reference / Transaction Notes</label>
                        <textarea
                          rows={2}
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="e.g. check ref #, bank wire code..."
                          className="mt-2 block w-full px-4 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none"
                        />
                      </div>

                      <div className="border-t border-gray-800 pt-4 mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsPaymentFormOpen(false)}
                          className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={paymentSubmitting}
                          className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                        >
                          {paymentSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Confirm Payment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quotations Tab View */}
          {activeTab === 'quotations' && (
            <div className="space-y-6">
              {!selectedQuote ? (
                // View 1: Quotations List View
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white">Quotations & Estimations</h2>
                      <p className="mt-1 text-sm text-gray-400">Manage quotations, track status, generate prints, or convert quotes to official invoices.</p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      {hasPermission(user, 'manage:quotations') && (
                        <button
                          onClick={handleOpenAddQuote}
                          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Create Quotation
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                      <div className="relative w-full sm:w-60">
                        <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={quoteSearch}
                          onChange={(e) => {
                            setQuoteSearch(e.target.value);
                            setQuoteCurrentPage(1);
                          }}
                          placeholder="Search quote number or customer..."
                          className="pl-9 pr-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                        />
                      </div>

                      <select
                        value={quoteFilterStatus}
                        onChange={(e) => {
                          setQuoteFilterStatus(e.target.value);
                          setQuoteCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full sm:w-40"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Expired">Expired</option>
                      </select>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs text-gray-500">Sort:</span>
                        <select
                          value={quoteSortField}
                          onChange={(e) => setQuoteSortField(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="issueDate">Issue Date</option>
                          <option value="quoteNumber">Quote Number</option>
                          <option value="totalAmount">Total Amount</option>
                          <option value="expiryDate">Expiry Date</option>
                          <option value="customer">Customer Name</option>
                        </select>
                        <select
                          value={quoteSortOrder}
                          onChange={(e) => setQuoteSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <button
                        onClick={handleExportQuotations}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                        title="Export Quotations as CSV file"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Quotations List table */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    {loadingQuotes ? (
                      <div className="flex flex-col items-center py-20">
                        <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
                        <p className="mt-4 text-sm text-gray-400">Searching quotations...</p>
                      </div>
                    ) : processedQuotations.length === 0 ? (
                      <div className="text-center py-20 space-y-4">
                        <FileSignature className="h-12 w-12 text-gray-600 mx-auto" />
                        <h3 className="font-bold text-white text-lg">No Quotations Found</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                          Adjust your status or query filters, or create a new quotation proposal.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                              <th className="py-4 px-6">Quote Number</th>
                              <th className="py-4 px-6">Customer</th>
                              <th className="py-4 px-6">Expiry Date</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Total Amount</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60">
                            {paginatedQuotations.map((quote) => (
                              <tr
                                key={quote.id}
                                onClick={() => loadQuoteDetails(quote)}
                                className="group hover:bg-[#1f2833]/30 cursor-pointer transition-colors duration-150"
                              >
                                <td className="py-4 px-6">
                                  <span className="font-bold text-white group-hover:text-[#45f3ff] transition-colors">
                                    {quote.quoteNumber}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-300">
                                  {quote.customer.name}
                                  {quote.customer.businessName && (
                                    <span className="block text-[10px] text-gray-500">{quote.customer.businessName}</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-400">
                                  {new Date(quote.expiryDate).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    quote.status === 'Accepted'
                                      ? 'bg-[#86c232]/10 text-[#86c232] border border-[#86c232]/30'
                                      : quote.status === 'Sent'
                                      ? 'bg-[#45f3ff]/10 text-[#45f3ff] border border-[#45f3ff]/30'
                                      : quote.status === 'Rejected' || quote.status === 'Expired'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                                  }`}>
                                    {quote.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right font-semibold text-white">
                                  {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(quote.totalAmount)}
                                </td>
                                <td className="py-4 px-6 text-right text-xs">
                                  <div className="inline-flex items-center space-x-2">
                                    {hasPermission(user, 'manage:quotations') && (
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleOpenEditQuote(quote, e); }}
                                          className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700 hover:border-gray-600"
                                          title="Edit Quote"
                                          disabled={quote.status === 'Accepted'}
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id, e); }}
                                          className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30 hover:border-red-900/50"
                                          title="Delete Quote"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800/60 text-xs">
                          <span className="text-gray-500">
                            Showing {Math.min(processedQuotations.length, (quoteCurrentPage - 1) * quoteItemsPerPage + 1)} to {Math.min(processedQuotations.length, quoteCurrentPage * quoteItemsPerPage)} of {processedQuotations.length} entries
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              disabled={quoteCurrentPage === 1}
                              onClick={(e) => { e.stopPropagation(); setQuoteCurrentPage(prev => Math.max(prev - 1, 1)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Prev
                            </button>
                            {[...Array(quoteTotalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setQuoteCurrentPage(i + 1); }}
                                className={`px-3 py-1.5 rounded font-bold ${
                                  quoteCurrentPage === i + 1
                                    ? 'bg-[#45f3ff] text-[#0b0c10]'
                                    : 'bg-[#0f0f15]/80 text-gray-400 hover:bg-gray-800'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              disabled={quoteCurrentPage === quoteTotalPages}
                              onClick={(e) => { e.stopPropagation(); setQuoteCurrentPage(prev => Math.min(prev + 1, quoteTotalPages)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // View 2: Quotation Details & Items View
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-5">
                    <button
                      onClick={() => {
                        setSelectedQuote(null);
                      }}
                      className="inline-flex items-center text-sm font-semibold text-[#45f3ff] hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      Back to Quotations List
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setPrintingQuote(selectedQuote)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Print / PDF
                      </button>

                      {selectedQuote.status !== 'Accepted' ? (
                        <>
                          {hasPermission(user, 'manage:invoices') && (
                            <button
                              onClick={() => handleConvertQuote(selectedQuote.id)}
                              disabled={convertingQuoteId === selectedQuote.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#86c232] hover:bg-[#86c232]/80 transition-colors disabled:opacity-50"
                            >
                              {convertingQuoteId === selectedQuote.id ? (
                                <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />
                              ) : (
                                <FileCheck className="h-3.5 w-3.5 mr-1" />
                              )}
                              Convert to Invoice
                            </button>
                          )}
                          
                          {hasPermission(user, 'manage:quotations') && (
                            <button
                              onClick={(e) => handleOpenEditQuote(selectedQuote, e)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit Quote
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-[#86c232] bg-[#86c232]/10 border border-[#86c232]/30">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Converted to Invoice
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Sheet */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-800/80 pb-6 gap-4">
                      <div>
                        <h3 className="font-extrabold text-white text-2xl">{selectedQuote.quoteNumber}</h3>
                        <p className="text-xs text-gray-400 mt-1">Generated proposal details</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase ${
                          selectedQuote.status === 'Accepted'
                            ? 'bg-[#86c232]/10 text-[#86c232] border border-[#86c232]/30'
                            : selectedQuote.status === 'Sent'
                            ? 'bg-[#45f3ff]/10 text-[#45f3ff] border border-[#45f3ff]/30'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {selectedQuote.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          Valid: {new Date(selectedQuote.issueDate).toLocaleDateString()} &mdash; {new Date(selectedQuote.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">From</h4>
                        <p className="font-bold text-white">{companyName}</p>
                        <p className="text-xs text-gray-400 whitespace-pre-line mt-1">{address}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bill To</h4>
                        <p className="font-bold text-white">{selectedQuote.customer.name}</p>
                        {selectedQuote.customer.businessName && <p className="text-xs text-[#45f3ff]">{selectedQuote.customer.businessName}</p>}
                        {selectedQuote.customer.address && <p className="text-xs text-gray-400 whitespace-pre-line mt-1">{selectedQuote.customer.address}</p>}
                      </div>
                    </div>

                    <div className="border border-gray-800 rounded-xl overflow-hidden mt-6">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800 bg-black/40 text-xs font-bold uppercase tracking-wider text-gray-400">
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-4 text-right">Unit Price</th>
                            <th className="py-3 px-4 text-right">Tax %</th>
                            <th className="py-3 px-4 text-right">Disc %</th>
                            <th className="py-3 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-gray-300">
                          {selectedQuote.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-800/20">
                              <td className="py-3 px-4 font-semibold text-white">{item.description}</td>
                              <td className="py-3 px-4 text-center">{item.quantity}</td>
                              <td className="py-3 px-4 text-right">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.unitPrice)}
                              </td>
                              <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                              <td className="py-3 px-4 text-right">{item.discountRate}%</td>
                              <td className="py-3 px-4 text-right font-bold text-white">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-800/80">
                      <div className="w-64 space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="text-white">
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
                              selectedQuote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
                            )}
                          </span>
                        </div>
                        {selectedQuote.discountAmount > 0 && (
                          <div className="flex justify-between text-red-400">
                            <span>Discount:</span>
                            <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedQuote.discountAmount)}</span>
                          </div>
                        )}
                        {selectedQuote.taxAmount > 0 && (
                          <div className="flex justify-between text-gray-400">
                            <span>Tax:</span>
                            <span className="text-white">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedQuote.taxAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-800 pt-2 text-base font-black text-white">
                          <span>Total Amount:</span>
                          <span className="text-[#45f3ff]">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(selectedQuote.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedQuote.notes && (
                      <div className="border-t border-gray-800/80 pt-6 space-y-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Terms & Notes</h5>
                        <p className="text-xs text-gray-300 leading-relaxed bg-black/40 border border-gray-800 p-4 rounded-xl whitespace-pre-line">
                          {selectedQuote.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add/Edit Quote Editor overlay */}
              {isQuoteFormOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
                  <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
                    <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                      <h3 className="font-extrabold text-white text-lg">
                        {editingQuote ? `Edit Quotation ${editingQuote.quoteNumber}` : 'Create New Quotation'}
                      </h3>
                      <button onClick={() => setIsQuoteFormOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleQuoteSubmit} className="p-6 space-y-6">
                      {quoteFormError && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                          {quoteFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Select Customer</label>
                          <select
                            value={quoteCustomerId}
                            onChange={(e) => setQuoteCustomerId(e.target.value)}
                            required
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          >
                            <option value="" disabled>Choose customer...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Issue Date</label>
                          <input
                            type="date"
                            required
                            value={quoteIssueDate}
                            onChange={(e) => setQuoteIssueDate(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Valid Until (Expiry)</label>
                          <input
                            type="date"
                            required
                            value={quoteExpiryDate}
                            onChange={(e) => setQuoteExpiryDate(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                          <h4 className="text-sm font-bold text-white">Line Items</h4>
                          <button
                            type="button"
                            onClick={handleAddLineItem}
                            className="inline-flex items-center text-xs font-bold text-[#45f3ff] hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Row
                          </button>
                        </div>

                        <div className="space-y-3">
                          {quoteItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-black/25 border border-gray-800/80 p-4 rounded-xl relative group">
                              <div className="flex-1 w-full">
                                <input
                                  type="text"
                                  placeholder="Description"
                                  required
                                  value={item.description}
                                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-32">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  required
                                  value={item.unitPrice}
                                  onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-right text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  value={item.taxRate}
                                  onChange={(e) => handleLineItemChange(index, 'taxRate', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-20">
                                <input
                                  type="number"
                                  value={item.discountRate}
                                  onChange={(e) => handleLineItemChange(index, 'discountRate', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-center text-sm"
                                />
                              </div>
                              <div className="w-full md:w-32 text-right py-2 text-sm font-bold text-white pr-2">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.totalAmount)}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(index)}
                                disabled={quoteItems.length === 1}
                                className="p-2 text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Terms & Conditions</label>
                          <textarea
                            rows={4}
                            value={quoteNotes}
                            onChange={(e) => setQuoteNotes(e.target.value)}
                            placeholder="Add terms, validity details..."
                            className="mt-2 block w-full px-4 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none text-sm"
                          />
                        </div>

                        <div className="bg-black/30 border border-gray-800 rounded-xl p-5 flex flex-col justify-center space-y-3">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal:</span>
                            <span className="text-white font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getTotals().subtotal)}</span>
                          </div>
                          {getTotals().discount > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                              <span>Discount:</span>
                              <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getTotals().discount)}</span>
                            </div>
                          )}
                          {getTotals().tax > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                              <span>Tax Amount:</span>
                              <span className="text-white font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getTotals().tax)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-gray-800 pt-3 text-lg font-black text-white">
                            <span>Grand Total:</span>
                            <span className="text-[#45f3ff]">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(getTotals().grandTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsQuoteFormOpen(false)}
                          className="px-4 py-2.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          onClick={() => setQuoteStatus('Draft')}
                          disabled={quoteFormSubmitting}
                          className="px-4 py-2.5 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 bg-gray-900/60"
                        >
                          Save as Draft
                        </button>
                        <button
                          type="submit"
                          onClick={() => setQuoteStatus('Sent')}
                          disabled={quoteFormSubmitting}
                          className="px-5 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7]"
                        >
                          {quoteFormSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Save & Send Quote'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customers Tab View */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {!selectedCustomer ? (
                // View 1: Customer List View
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white">Customer Database</h2>
                      <p className="mt-1 text-sm text-gray-400">View details, contact info, invoice metrics, and notes for your clients.</p>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      {hasPermission(user, 'manage:customers') && (
                        <button
                          onClick={handleOpenAddCustomer}
                          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Plus className="h-4 w-4 mr-1.5" /> Add Customer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search and sorting bar */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                      <div className="relative w-full sm:w-60">
                        <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setCustomerCurrentPage(1);
                          }}
                          placeholder="Search customer name, business or email..."
                          className="pl-9 pr-3 py-2 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs text-gray-500">Sort:</span>
                        <select
                          value={customerSortField}
                          onChange={(e) => setCustomerSortField(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="name">Customer Name</option>
                          <option value="businessName">Business Name</option>
                          <option value="email">Email</option>
                        </select>
                        <select
                          value={customerSortOrder}
                          onChange={(e) => setCustomerSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-2.5 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none"
                        >
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <button
                        onClick={handleExportCustomers}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                        title="Export Customers as CSV file"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                      </button>
                      {hasPermission(user, 'manage:customers') && (
                        <button
                          onClick={() => { setCsvImportType('customers'); setIsCsvImportOpen(true); }}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-white transition-all flex items-center"
                          title="Import Customers from CSV file"
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Import CSV
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    {loadingCustomers ? (
                      <div className="flex flex-col items-center py-20">
                        <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
                        <p className="mt-4 text-sm text-gray-400">Searching customers...</p>
                      </div>
                    ) : processedCustomers.length === 0 ? (
                      <div className="text-center py-20 space-y-4">
                        <Users className="h-12 w-12 text-gray-600 mx-auto" />
                        <h3 className="font-bold text-white text-lg">No Customers Found</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                          Adjust your query filter criteria or register a new customer profile.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-800/80 bg-gray-950/20 text-xs font-bold uppercase tracking-wider text-gray-400">
                              <th className="py-4 px-6">Name</th>
                              <th className="py-4 px-6">Business Name</th>
                              <th className="py-4 px-6">Contact Info</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60">
                            {paginatedCustomers.map((cust) => (
                              <tr
                                key={cust.id}
                                onClick={() => loadCustomerDetails(cust)}
                                className="group hover:bg-[#1f2833]/30 cursor-pointer transition-colors duration-150"
                              >
                                <td className="py-4 px-6">
                                  <span className="font-bold text-white group-hover:text-[#45f3ff] transition-colors">{cust.name}</span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-300">{cust.businessName || <span className="text-gray-600">-</span>}</td>
                                <td className="py-4 px-6 text-xs text-gray-400 space-y-1">
                                  {cust.email && <div className="flex items-center"><Mail className="h-3 w-3 mr-1 text-[#45f3ff]" />{cust.email}</div>}
                                  {cust.phone && <div className="flex items-center"><Phone className="h-3 w-3 mr-1 text-[#6f42c1]" />{cust.phone}</div>}
                                </td>
                                <td className="py-4 px-6 text-right text-xs">
                                  <div className="inline-flex items-center space-x-3">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenEditCustomer(cust, e); }}
                                      className="p-1.5 bg-gray-800/80 text-gray-400 hover:text-white rounded border border-gray-700"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(cust.id, e); }}
                                      className="p-1.5 bg-red-950/20 text-red-400 hover:text-red-300 rounded border border-red-900/30"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800/60 text-xs">
                          <span className="text-gray-500">
                            Showing {Math.min(processedCustomers.length, (customerCurrentPage - 1) * customerItemsPerPage + 1)} to {Math.min(processedCustomers.length, customerCurrentPage * customerItemsPerPage)} of {processedCustomers.length} entries
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              disabled={customerCurrentPage === 1}
                              onClick={(e) => { e.stopPropagation(); setCustomerCurrentPage(prev => Math.max(prev - 1, 1)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Prev
                            </button>
                            {[...Array(customerTotalPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setCustomerCurrentPage(i + 1); }}
                                className={`px-3 py-1.5 rounded font-bold ${
                                  customerCurrentPage === i + 1
                                    ? 'bg-[#45f3ff] text-[#0b0c10]'
                                    : 'bg-[#0f0f15]/80 text-gray-400 hover:bg-gray-800'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              disabled={customerCurrentPage === customerTotalPages}
                              onClick={(e) => { e.stopPropagation(); setCustomerCurrentPage(prev => Math.min(prev + 1, customerTotalPages)); }}
                              className="px-2.5 py-1.5 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // View 2: Customer Details & Metrics
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-5">
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerMetrics(null);
                      }}
                      className="inline-flex items-center text-sm font-semibold text-[#45f3ff] hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Customer List
                    </button>
                    <div className="flex items-center space-x-3">
                      {hasPermission(user, 'manage:customers') && (
                        <>
                          <button
                            onClick={(e) => handleOpenEditCustomer(selectedCustomer, e)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Profile
                          </button>
                          <button
                            onClick={(e) => handleDeleteCustomer(selectedCustomer.id, e)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-900/30 rounded-lg text-xs font-semibold text-red-400 bg-red-950/20 hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Customer
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                        <div className="text-center space-y-3">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#45f3ff]/20 to-[#6f42c1]/20 border border-[#45f3ff]/30 flex items-center justify-center text-[#45f3ff] font-extrabold text-2xl mx-auto">
                            {selectedCustomer.name[0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-white text-xl">{selectedCustomer.name}</h3>
                            {selectedCustomer.businessName && (
                              <p className="text-xs text-[#86c232] font-semibold uppercase tracking-wider">{selectedCustomer.businessName}</p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-gray-800/80 pt-4 space-y-4 text-sm text-gray-300">
                          {selectedCustomer.email && (
                            <div className="flex items-start">
                              <Mail className="h-5 w-5 mr-3 text-gray-500 shrink-0" />
                              <div className="min-w-0 break-words">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email</p>
                                <p className="text-white font-medium">{selectedCustomer.email}</p>
                              </div>
                            </div>
                          )}

                          {selectedCustomer.phone && (
                            <div className="flex items-start">
                              <Phone className="h-5 w-5 mr-3 text-gray-500 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone</p>
                                <p className="text-white font-medium">{selectedCustomer.phone}</p>
                              </div>
                            </div>
                          )}

                          {selectedCustomer.address && (
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 mr-3 text-gray-500 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Billing Address</p>
                                <p className="text-white font-medium whitespace-pre-line">{selectedCustomer.address}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start">
                            <Calendar className="h-5 w-5 mr-3 text-gray-500 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Added On</p>
                              <p className="text-white font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Invoices</span>
                          <span className="text-3xl font-black text-white mt-3">{loadingMetrics ? '...' : customerMetrics?.totalInvoices ?? 0}</span>
                        </div>

                        <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Outstanding Balance</span>
                          <span className="text-3xl font-black text-red-400 mt-3">
                            {loadingMetrics ? '...' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(customerMetrics?.outstandingBalance ?? 0)}
                          </span>
                        </div>

                        <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between min-h-[110px]">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Last Payment</span>
                          {loadingMetrics ? (
                            <span className="text-lg font-bold text-white mt-3">...</span>
                          ) : customerMetrics?.lastPayment ? (
                            <div className="mt-2 leading-tight">
                              <span className="text-xl font-bold text-[#86c232]">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(customerMetrics.lastPayment.amount)}</span>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(customerMetrics.lastPayment.date).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-500 mt-3">No payments</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                        <h4 className="font-bold text-white text-md flex items-center"><FileSpreadsheet className="h-5 w-5 mr-2 text-[#45f3ff]" /> Recent Invoices</h4>
                        {loadingMetrics ? (
                          <div className="flex flex-col items-center py-10"><Loader2 className="animate-spin h-8 w-8 text-[#45f3ff]" /></div>
                        ) : !customerMetrics?.purchaseHistory || customerMetrics.purchaseHistory.length === 0 ? (
                          <div className="text-center py-10 bg-black/20 border border-gray-800 rounded-xl"><p className="text-xs text-gray-500 uppercase tracking-wider">No invoice history</p></div>
                        ) : (
                          <div className="overflow-x-auto border border-gray-800 rounded-xl">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-gray-800 bg-black/40 text-xs font-bold uppercase tracking-wider text-gray-400">
                                  <th className="py-3 px-4">Invoice #</th>
                                  <th className="py-3 px-4">Issue Date</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerMetrics.purchaseHistory.map((invoice) => (
                                  <tr key={invoice.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="py-3 px-4 font-bold text-white">{invoice.invoiceNumber}</td>
                                    <td className="py-3 px-4 text-xs text-gray-400">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-gray-800 text-gray-400 border-gray-700">{invoice.status}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold text-white">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(invoice.totalAmount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business settings View */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5">
                <div>
                  <h2 className="text-3xl font-extrabold text-white">Business Settings</h2>
                  <p className="mt-1 text-sm text-gray-400">Configure your company information, default currency, and invoice formats.</p>
                </div>
                <div className="mt-3 sm:mt-0 bg-gray-800/40 border border-gray-700 px-3 py-1.5 rounded-lg flex items-center">
                  <Building className="h-4 w-4 mr-2 text-[#45f3ff]" />
                  <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                    {business?.name || 'My Company'}
                  </span>
                </div>
              </div>

              {/* Logo Card Section */}
              <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Company Logo</h3>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden bg-black/40 relative group">
                    {business?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.logoUrl} alt="Logo" className="object-contain h-full w-full" />
                    ) : (
                      <Briefcase className="h-10 w-10 text-gray-600" />
                    )}
                    {logoUploading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="animate-spin h-6 w-6 text-[#45f3ff]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-sm font-semibold text-white">Upload a Logo image</p>
                    <p className="text-xs text-gray-400">Supported formats: PNG, JPG, WEBP. Max size: 2MB.</p>
                    
                    {logoError && (
                      <div className="flex items-center text-xs text-red-400 mt-1 justify-center sm:justify-start">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        {logoError}
                      </div>
                    )}

                    <div className="pt-2 flex justify-center sm:justify-start">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200">
                        <Upload className="h-3.5 w-3.5 mr-2 text-[#45f3ff]" />
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Details Card */}
              <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Configuration</h3>
                
                <form onSubmit={handleBusinessSaveLocal} className="space-y-6">
                  {businessMsg.text && (
                    <div className={`px-4 py-3 rounded-lg text-sm flex items-center border ${
                      businessMsg.type === 'success'
                        ? 'bg-[#86c232]/10 border-[#86c232]/30 text-[#86c232]'
                        : 'bg-red-950/40 border-red-500/30 text-red-200'
                    }`}>
                      {businessMsg.type === 'success' ? <Check className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                      {businessMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Tax Number</label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="e.g. EU123456789"
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Business Address</label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Default Currency</label>
                      <div className="mt-2 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        </div>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="block w-full pl-9 pr-3 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                          <option value="NGN">NGN (₦)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Numbering Prefix</label>
                      <div className="mt-2 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={invoicePrefix}
                          onChange={(e) => setInvoicePrefix(e.target.value)}
                          className="block w-full pl-9 pr-3 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Number Padding digits</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={invoicePadding}
                        onChange={(e) => setInvoicePadding(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Next Invoice Number Sequence</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={nextInvoiceNumber}
                        onChange={(e) => setNextInvoiceNumber(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={businessSubmitting}
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7]"
                    >
                      {businessSubmitting ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </div>
              {/* Team Management and Custom Roles Panels */}
              {hasPermission(user, 'manage:team') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Team Members List */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-white text-md">Team Members</h3>
                        <p className="text-[10px] text-gray-500 font-normal">Invite new members and manage system logins.</p>
                      </div>
                      <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all flex items-center"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Invite
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800/80 bg-gray-950/20 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 text-gray-300">
                          {loadingTeam ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-gray-500">Loading team members...</td>
                            </tr>
                          ) : teamMembers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-gray-500">No team members registered.</td>
                            </tr>
                          ) : (
                            teamMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-gray-800/10">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-white">{member.name || 'Pending Details'}</div>
                                  <div className="text-[10px] text-gray-500 font-normal">{member.email}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-800 border border-gray-700 text-gray-300">
                                    {member.roleName}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                    member.status === 'Active'
                                      ? 'bg-[#86c232]/10 border-[#86c232]/30 text-[#86c232]'
                                      : 'bg-yellow-950/25 border-yellow-900/40 text-yellow-500'
                                  }`}>
                                    {member.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {member.roleName !== 'Owner' && (
                                    <button
                                      onClick={() => handleDeleteTeamMember(member.id)}
                                      className="p-1 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900 bg-red-950/10 rounded"
                                      title="Remove Member"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Custom Roles List */}
                  <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-white text-md">Custom User Roles</h3>
                        <p className="text-[10px] text-gray-500 font-normal">Define business roles and select active permission sets.</p>
                      </div>
                      <button
                        onClick={() => setIsRoleModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all flex items-center"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800/80 bg-gray-950/20 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Role Name</th>
                            <th className="py-2.5 px-3">Permissions Included</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 text-gray-300">
                          {loadingRoles ? (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-500">Loading custom roles...</td>
                            </tr>
                          ) : customRoles.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-500">No custom roles built yet. Default roles: Owner, Admin, Manager, Staff.</td>
                            </tr>
                          ) : (
                            customRoles.map((role) => (
                              <tr key={role.id} className="hover:bg-gray-800/10">
                                <td className="py-3 px-3 font-semibold text-white">{role.name}</td>
                                <td className="py-3 px-3">
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {role.permissions.split(',').map((perm: string) => (
                                      <span key={perm} className="px-1 py-0.5 rounded text-[8px] bg-black/40 border border-gray-800 text-gray-400">
                                        {perm}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => handleDeleteCustomRole(role.id)}
                                    className="p-1 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-900 bg-red-950/10 rounded"
                                    title="Delete Role"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Backup & Recovery Panel (Owner Only) */}
              {user.businessUser?.roleName === 'Owner' && (
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4 mt-6">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-white text-md">Database Backups & Disaster Recovery</h3>
                      <p className="text-[10px] text-gray-500 font-normal">Create and restore snapshot backups of the database files. Backups older than 7 days are auto-purged.</p>
                    </div>
                    <button
                      onClick={handleCreateBackup}
                      disabled={loadingBackups}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all flex items-center disabled:opacity-50 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Backup Now
                    </button>
                  </div>

                  {backupError && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-xs flex items-center animate-none">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-400 shrink-0" />
                      {backupError}
                    </div>
                  )}

                  {backupSuccess && (
                    <div className="bg-[#86c232]/10 border border-[#86c232]/30 text-[#86c232] px-3 py-2 rounded-lg text-xs flex items-center animate-none">
                      <Check className="h-4 w-4 mr-2 text-[#86c232] shrink-0" />
                      {backupSuccess}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800/80 bg-gray-950/20 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">File Name</th>
                          <th className="py-2.5 px-3">File Size</th>
                          <th className="py-2.5 px-3">Created Date</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 text-gray-300">
                        {loadingBackups ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500">Loading database snapshots...</td>
                          </tr>
                        ) : backups.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500">No database backups found. Snapshot files will appear here.</td>
                          </tr>
                        ) : (
                          backups.map((b) => (
                            <tr key={b.filename} className="hover:bg-gray-800/10">
                              <td className="py-3 px-3 font-mono text-[#45f3ff] text-[11px] truncate max-w-[220px]" title={b.filename}>
                                {b.filename}
                              </td>
                              <td className="py-3 px-3 text-gray-400">
                                {(b.size / (1024 * 1024)).toFixed(2)} MB
                              </td>
                              <td className="py-3 px-3 text-gray-400">
                                {new Date(b.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                                <a
                                  href={`/api/business/backups?file=${encodeURIComponent(b.filename)}`}
                                  className="inline-flex px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700 font-bold text-[10px]"
                                  title="Download Backup File"
                                >
                                  Download
                                </a>
                                <button
                                  onClick={() => handleRestoreBackup(b.filename)}
                                  className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded border border-red-900/30 font-bold text-[10px]"
                                  title="Restore snapshot"
                                >
                                  Restore
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Audit Trail Activity Timeline (Owner or Admin Only) */}
              {(user.businessUser?.roleName === 'Owner' || user.businessUser?.roleName === 'Admin') && (
                <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-4 mt-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-800 pb-3 gap-3">
                    <div>
                      <h3 className="font-extrabold text-white text-md">Security Audit Trail & Activity Logs</h3>
                      <p className="text-[10px] text-gray-500 font-normal">Real-time ledger recording user operations, login updates, database mutations, settings, and billing triggers.</p>
                    </div>
                    {/* Search log action input */}
                    <div className="relative w-full sm:w-60 shrink-0">
                      <Search className="h-3.5 w-3.5 text-gray-500 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={activitySearchQuery}
                        onChange={(e) => {
                          setActivitySearchQuery(e.target.value);
                          setActivityCurrentPage(1);
                        }}
                        placeholder="Search logs..."
                        className="pl-8 pr-3 py-1.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#45f3ff] w-full"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800/80 bg-gray-950/20 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Operation / Action</th>
                          <th className="py-2.5 px-3">User Email</th>
                          <th className="py-2.5 px-3">Details / Parameters</th>
                          <th className="py-2.5 px-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 text-gray-300">
                        {loadingActivityLogs && activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-500">Loading audit trail logs...</td>
                          </tr>
                        ) : activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-500">No activity matching filter parameters.</td>
                          </tr>
                        ) : (
                          activityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-800/10">
                              <td className="py-3 px-3 whitespace-nowrap text-gray-500 font-mono text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/40 border border-gray-800 text-[#45f3ff]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-white font-semibold whitespace-nowrap">
                                {log.userEmail || 'System / Auto'}
                              </td>
                              <td className="py-3 px-3 max-w-[250px] truncate text-gray-400" title={
                                typeof log.details === 'object' && log.details !== null
                                  ? JSON.stringify(log.details)
                                  : log.details || ''
                              }>
                                {typeof log.details === 'object' && log.details !== null
                                  ? Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')
                                  : log.details || '-'}
                              </td>
                              <td className="py-3 px-3 text-gray-500 font-mono text-[10px]">
                                {log.ipAddress || 'unknown'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Log timeline pagination */}
                  {activityTotalPages > 1 && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-800/50 text-[10px]">
                      <span className="text-gray-500">Page {activityCurrentPage} of {activityTotalPages}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          disabled={activityCurrentPage === 1}
                          onClick={() => setActivityCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="px-2 py-1 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Prev
                        </button>
                        <button
                          disabled={activityCurrentPage === activityTotalPages}
                          onClick={() => setActivityCurrentPage(prev => Math.min(prev + 1, activityTotalPages))}
                          className="px-2 py-1 bg-[#0f0f15]/80 hover:bg-gray-800 border border-gray-800 rounded disabled:opacity-50 text-gray-400"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User profile Settings View */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-gray-800 pb-5">
                <h2 className="text-3xl font-extrabold text-white">User Profile Settings</h2>
                <p className="mt-1 text-sm text-gray-400">Manage your profile name and update your account password.</p>
              </div>

              <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md">
                <form onSubmit={handleProfileSave} className="space-y-6">
                  {profileMsg.text && (
                    <div className={`px-4 py-3 rounded-lg text-sm flex items-center border ${
                      profileMsg.type === 'success'
                        ? 'bg-[#86c232]/10 border-[#86c232]/30 text-[#86c232]'
                        : 'bg-red-950/40 border-red-500/30 text-red-200'
                    }`}>
                      {profileMsg.type === 'success' ? <Check className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Email Address (Read-only)</label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="mt-2 block w-full px-4 py-3 bg-gray-900/60 border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Display Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="border-t border-gray-800/80 pt-6">
                      <h4 className="font-bold text-white text-md mb-2">Change Password</h4>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          placeholder="••••••••"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-2 block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSubmitting}
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7]"
                    >
                      {profileSubmitting ? 'Saving...' : 'Save Profile Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Invite Member Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                  <h3 className="font-extrabold text-white text-md">Invite Team Member</h3>
                  <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                  {inviteError && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                      {inviteError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@company.com"
                      className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Full Name (Optional)</label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Select Access Role</label>
                    <select
                      required
                      value={inviteRoleId ? `custom:${inviteRoleId}:${inviteRoleName}` : inviteRoleName}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('custom:')) {
                          const parts = val.split(':');
                          setInviteRoleId(parts[1]);
                          setInviteRoleName(parts[2]);
                        } else {
                          setInviteRoleId('');
                          setInviteRoleName(val);
                        }
                      }}
                      className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white focus:outline-none text-xs"
                    >
                      <optgroup label="Default Built-In Roles" className="bg-[#1a1a24]">
                        <option value="Admin">Admin (Full Control)</option>
                        <option value="Manager">Manager (Edit except Billing/Team)</option>
                        <option value="Staff">Staff (Read-Only Access)</option>
                      </optgroup>
                      {customRoles.length > 0 && (
                        <optgroup label="Custom Roles Builder" className="bg-[#1a1a24]">
                          {customRoles.map((role) => (
                            <option key={role.id} value={`custom:${role.id}:${role.name}`}>
                              {role.name} (Custom Setup)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteSubmitting}
                      className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                    >
                      {inviteSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Custom Role Builder Modal */}
          {isRoleModalOpen && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4">
                  <h3 className="font-extrabold text-white text-md">Build Custom Access Role</h3>
                  <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
                  {roleError && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                      {roleError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Role Name</label>
                    <input
                      type="text"
                      required
                      value={roleFormName}
                      onChange={(e) => setRoleFormName(e.target.value)}
                      placeholder="e.g. Sales Specialist, Support Staff"
                      className="mt-2 block w-full px-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono mb-2">Select Permissions</label>
                    <div className="space-y-2 bg-[#0f0f15]/80 border border-gray-800 p-3 rounded-lg max-h-60 overflow-y-auto">
                      {[
                        { key: 'view:dashboard', label: 'View Dashboard Analytics' },
                        { key: 'view:invoices', label: 'View Invoices' },
                        { key: 'manage:invoices', label: 'Manage Invoices (Create, Pay)' },
                        { key: 'view:quotations', label: 'View Quotations' },
                        { key: 'manage:quotations', label: 'Manage Quotations (Create, Convert)' },
                        { key: 'view:expenses', label: 'View Expenses Outflow' },
                        { key: 'manage:expenses', label: 'Manage Expenses & Categories' },
                        { key: 'view:inventory', label: 'View Stock Inventory' },
                        { key: 'manage:inventory', label: 'Manage Inventory (Create, Adjust)' },
                        { key: 'view:customers', label: 'View Customers Database' },
                        { key: 'manage:customers', label: 'Manage Customers (Create, Edit)' }
                      ].map((perm) => (
                        <label key={perm.key} className="flex items-start text-xs text-gray-300 cursor-pointer hover:text-white select-none py-1">
                          <input
                            type="checkbox"
                            checked={roleFormPermissions.includes(perm.key)}
                            onChange={() => handlePermissionToggle(perm.key)}
                            className="h-4 w-4 bg-[#0f0f15]/80 border-gray-800 rounded text-[#45f3ff] focus:ring-[#45f3ff] mr-2.5 mt-0.5"
                          />
                          <div>
                            <span className="font-bold block text-[11px]">{perm.label}</span>
                            <span className="text-[9px] text-gray-500 font-mono">{perm.key}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsRoleModalOpen(false)}
                      className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={roleSubmitting}
                      className="px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center"
                    >
                      {roleSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Create Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CSV Bulk Import Preview & Mapped Validation Modal */}
      {isCsvImportOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-[#45f3ff]/20 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-800 px-6 py-4 shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-md">
                  Bulk CSV Import Preview: {csvImportType === 'products' ? 'Products Catalog' : 'Customers Directory'}
                </h3>
                <p className="text-[10px] text-gray-500 font-normal">Review and validate parsed records before saving them to the database.</p>
              </div>
              <button
                onClick={() => {
                  setIsCsvImportOpen(false);
                  setCsvPreviewData([]);
                  setCsvImportError('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {csvImportError && (
                <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center shrink-0 animate-none">
                  <AlertCircle className="h-5 w-5 mr-2 shrink-0 text-red-400" />
                  {csvImportError}
                </div>
              )}

              {/* Upload file section */}
              <div className="flex items-center space-x-3 bg-black/20 border border-gray-800 p-4 rounded-xl shrink-0">
                <label className="cursor-pointer inline-flex items-center px-4 py-2.5 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-colors shrink-0">
                  <Upload className="h-3.5 w-3.5 mr-2 text-[#45f3ff]" />
                  Upload CSV File
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileChange}
                    disabled={csvImporting}
                  />
                </label>
                <span className="text-xs text-gray-500">
                  Select a standard header-formatted CSV file. Make sure columns map accurately.
                </span>
              </div>

              {/* Preview table grid */}
              {csvPreviewData.length > 0 && (
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Parsed Records Preview ({csvPreviewData.length} Rows)</h4>
                  <div className="overflow-x-auto border border-gray-800 rounded-xl flex-1 min-h-0">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 font-bold uppercase tracking-wider sticky top-0 bg-[#1a1a24]">
                          {csvImportType === 'products' ? (
                            <>
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3 text-right">Selling Price</th>
                              <th className="py-2.5 px-3 text-right">Cost Price</th>
                              <th className="py-2.5 px-3 text-right">Quantity</th>
                              <th className="py-2.5 px-3">Unit</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3">Business Name</th>
                              <th className="py-2.5 px-3">Email</th>
                              <th className="py-2.5 px-3">Phone</th>
                              <th className="py-2.5 px-3">Address</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 text-gray-300">
                        {csvPreviewData.slice(0, 50).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-800/10">
                            {csvImportType === 'products' ? (
                              <>
                                <td className="py-2 px-3 font-mono text-[#45f3ff]">{row.sku}</td>
                                <td className="py-2 px-3 font-semibold text-white">{row.name}</td>
                                <td className="py-2 px-3 text-right">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(row.sellingPrice || 0))}</td>
                                <td className="py-2 px-3 text-right">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(row.costPrice || 0))}</td>
                                <td className="py-2 px-3 text-right font-bold">{row.quantity || 0}</td>
                                <td className="py-2 px-3 text-gray-400">{row.unit || 'pcs'}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-3 font-semibold text-white">{row.name}</td>
                                <td className="py-2 px-3 text-gray-400">{row.businessName || '-'}</td>
                                <td className="py-2 px-3 text-gray-400">{row.email || '-'}</td>
                                <td className="py-2 px-3 text-gray-400">{row.phone || '-'}</td>
                                <td className="py-2 px-3 text-gray-400 max-w-[150px] truncate" title={row.address || ''}>{row.address || '-'}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreviewData.length > 50 && (
                    <p className="text-[10px] text-gray-500 italic">Showing first 50 rows. The rest will import automatically.</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 px-6 py-4 flex justify-end space-x-3 shrink-0 bg-gray-950/20">
              <button
                type="button"
                onClick={() => {
                  setIsCsvImportOpen(false);
                  setCsvPreviewData([]);
                  setCsvImportError('');
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              {csvPreviewData.length > 0 && (
                <button
                  onClick={(e) => handleBulkImportSubmit(e)}
                  disabled={csvImporting}
                  className="px-5 py-2.5 border border-transparent rounded-lg text-xs font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 flex items-center animate-none"
                >
                  {csvImporting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Confirm Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- GUIDED SYSTEM TOUR POPUP WIZARD -------------------- */}
      {tourStep > 0 && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#1a1a24]/95 border border-[#45f3ff]/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-gradient-to-r from-[#45f3ff]/10 to-[#6f42c1]/10 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#45f3ff]">Onboarding Wizard (Step {tourStep} of 6)</span>
            <button onClick={() => setTourStep(0)} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 text-xs text-gray-300">
            <p className="leading-relaxed font-normal">
              {tourStep === 1 && "Welcome to your Operations Suite! First, look at the sidebar on the left. It acts as your primary navigation dock to jump between workspaces."}
              {tourStep === 2 && "Billing & Invoices tab. Here, you generate client invoices, record payment transactions, check balances, and view overdue alerts."}
              {tourStep === 3 && "Quotations tab. Draft price estimates for leads, then convert accepted estimates into invoices with one click."}
              {tourStep === 4 && "Expenses tab. Track business overheads, associate items with default or custom categories, and check the spending distribution donut chart."}
              {tourStep === 5 && "Inventory catalog. Monitor SKU stocks, record ledger adjustment items (Purchase, Sale, Return), set thresholds, and prevent negative stock transactions."}
              {tourStep === 6 && "Onboarding completed successfully! You can launch this guide wizard again at any time from the Tutorial & Guides tab. Enjoy your workspace!"}
            </p>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setTourStep(0)}
                className="text-gray-500 hover:text-gray-400 font-semibold"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {tourStep > 1 && (
                  <button
                    onClick={() => setTourStep(prev => prev - 1)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-semibold"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (tourStep === 6) {
                      setTourStep(0);
                    } else {
                      setTourStep(prev => prev + 1);
                    }
                  }}
                  className="px-3 py-1.5 rounded font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-colors"
                >
                  {tourStep === 6 ? 'Finish' : 'Next Step'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
