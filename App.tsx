
import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { POS } from './components/POS';
import { Ledger } from './components/Ledger';
import { Customers } from './components/Customers';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { SalaryManager } from './components/SalaryManager';
import { ActivityLogs } from './components/ActivityLogs';
import { AdminSettings } from './components/AdminSettings';
import { SalesHistory } from './components/SalesHistory';
import { ProductGroup, Sale, Language, StoreSettings, Expense, User, ActivityLog, Employee, SalaryRecord, StockLog, ProductVariant } from './types';
import { LayoutDashboard, ShoppingBag, Package, BookOpen, Menu, X, Languages, Home, Users, Wallet, PieChart, LogOut, History, UserCircle, Settings, FileText, CheckCircle, AlertCircle, Info, Lock, Loader2 } from 'lucide-react';

// --- Toast / Notification System ---
type ToastType = 'success' | 'error' | 'info';
interface ToastMsg {
  id: number;
  type: ToastType;
  msg: string;
}

export const LanguageContext = createContext<{
  lang: Language;
  t: (key: string) => string;
}>({ lang: 'bn', t: (k) => k });

export const ToastContext = createContext<{
  notify: (msg: string, type?: ToastType) => void;
}>({ notify: () => {} });

// --- Memoized Components to prevent unnecessary re-renders ---
const MemoDashboard = React.memo(Dashboard);
const MemoInventory = React.memo(Inventory);
const MemoPOS = React.memo(POS);
const MemoLedger = React.memo(Ledger);
const MemoCustomers = React.memo(Customers);
const MemoExpenses = React.memo(Expenses);
const MemoReports = React.memo(Reports);
const MemoSalaryManager = React.memo(SalaryManager);
const MemoActivityLogs = React.memo(ActivityLogs);
const MemoAdminSettings = React.memo(AdminSettings);
const MemoSalesHistory = React.memo(SalesHistory);

const translations: Record<string, Record<string, string>> = {
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  pos: { en: 'New Sale', bn: 'নতুন বিক্রি' },
  inventory: { en: 'Inventory', bn: 'স্টক খাতা' },
  ledger: { en: 'Due Ledger', bn: 'বাকি খাতা' },
  history: { en: 'Memos', bn: 'মেমো (Memo)' },
  customers: { en: 'Customers', bn: 'কাস্টমার' },
  expenses: { en: 'Expenses', bn: 'খরচের খাতা' },
  reports: { en: 'Reports', bn: 'রিপোর্ট' },
  salary: { en: 'Salary', bn: 'বেতন ও হাজিরা' },
  logs: { en: 'Logs', bn: 'লগ' },
  settings: { en: 'Settings', bn: 'সেটিংস' },
  appName: { en: 'Tinghor.com', bn: 'টিনঘর.কম' },
};

const LOGO_URL = "https://tinghor.com/wp-content/uploads/2023/11/tinghor-logo-150x150.png";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<Language>('bn');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // --- Data States (Initialized Empty for Fast First Paint) ---
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ brands: [], colors: [], thicknesses: [], productTypes: [], customFields: [], nextInvoiceId: 1001 });
  const [inventory, setInventory] = useState<ProductGroup[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // --- Async Data Loading (Prevent Page Hang) ---
  useEffect(() => {
    // Simulate async load to unblock main thread
    setTimeout(() => {
      const load = (key: string, def: any) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : def;
        } catch (e) {
          console.error(`Error loading ${key}`, e);
          return def;
        }
      };

      setUsers(load('app_users_v3', [
        { id: 'u1', name: 'মালিক (Admin)', email: 'admin@tinghor.com', password: 'admin@tinghor.com', role: 'admin', sessions: [] },
        { id: 'u2', name: 'ম্যানেজার', email: 'manager@tinghor.com', password: '1234', role: 'manager', sessions: [] }
      ]));
      setSettings(load('store_settings', {
        brands: ['AKS', 'PHP', 'TK', 'KDS', 'Appollo', 'Seven Rings', 'Anowar', 'Aramit', 'Local'],
        colors: ['White (Boicha)', 'Master Green', 'Green', 'Blue', 'Red', 'Silver', 'Plain/Natural', 'Charcoal'],
        thicknesses: ['0.19mm', '0.22mm', '0.25mm', '0.32mm', '0.34mm', '0.42mm', '0.46mm', 'Standard', 'N/A'],
        productTypes: ['ঢেউ টিন', 'ঢালা (Ridge)', 'ঝালট (Flashing)', 'স্ক্রু/নাট', 'অন্যান্য'],
        customFields: [],
        nextInvoiceId: 1001
      }));
      setInventory(load('inventory_v4', [
        {
          id: 'g1', productType: 'ঢেউ টিন', brand: 'AKS', color: 'White (Boicha)', thickness: '0.32mm', type: 'tin_bundle',
          variants: [{ id: 'v1', lengthFeet: 6, calculationBase: 72, stockPieces: 100, averageCost: 4200 }]
        }
      ]));
      setStockLogs(load('stock_logs_v1', []));
      setSales(load('sales_v3', []));
      setExpenses(load('expenses_v1', []));
      setEmployees(load('employees_v1', []));
      setSalaryRecords(load('salary_records_v1', []));
      setAttendance(load('attendance_v1', []));
      setLogs(load('activity_logs_v1', []));
      
      setIsDataLoaded(true);
    }, 100); 
  }, []);

  // --- Persistence Effects (Only write when data changes) ---
  // Using a custom debounce mechanism could optimize this further, but React effects are reasonable for now given we render less.
  useEffect(() => { if (isDataLoaded) localStorage.setItem('app_users_v3', JSON.stringify(users)); }, [users, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('store_settings', JSON.stringify(settings)); }, [settings, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('inventory_v4', JSON.stringify(inventory)); }, [inventory, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('stock_logs_v1', JSON.stringify(stockLogs)); }, [stockLogs, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('sales_v3', JSON.stringify(sales)); }, [sales, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('expenses_v1', JSON.stringify(expenses)); }, [expenses, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('employees_v1', JSON.stringify(employees)); }, [employees, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('salary_records_v1', JSON.stringify(salaryRecords)); }, [salaryRecords, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('attendance_v1', JSON.stringify(attendance)); }, [attendance, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('activity_logs_v1', JSON.stringify(logs)); }, [logs, isDataLoaded]);

  // --- Helpers ---
  const t = useCallback((key: string) => translations[key]?.[lang] || key, [lang]);

  const notify = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const logAction = useCallback((action: string, details: string) => {
    if (!currentUser) return;
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // --- STABLE Handlers (Wrapped in useCallback to prevent child re-renders) ---

  const handleLogin = () => {
    const user = users.find(u => u.email === loginEmail && u.password === loginPass);
    if (user) {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deviceName = navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop/Laptop';
      const newSession = { sessionId, deviceName, loginTime: Date.now(), isTrusted: false };
      const updatedUser = { ...user, sessions: [...(user.sessions || []), newSession] };
      
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setLoginEmail('');
      setLoginPass('');
      notify('স্বাগতম ' + user.name, 'success');
    } else {
      notify('ইমেইল বা পাসওয়ার্ড ভুল!', 'error');
    }
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    notify('লগআউট সফল হয়েছে', 'info');
  }, [notify]);

  const handleCompleteSale = useCallback((sale: Sale) => {
    setSettings(prev => {
       const newInvoiceId = prev.nextInvoiceId.toString();
       const saleWithMeta = { 
         ...sale, 
         invoiceId: newInvoiceId,
         soldBy: currentUser?.name || 'Unknown' 
       };
       
       setSales(prevSales => [saleWithMeta, ...prevSales]);
       
       // Optimization: Only update inventory if items are not manual
       if (sale.items.length > 0 && sale.items[0].groupId !== 'manual') {
         setInventory(prevInv => prevInv.map(group => {
           // Quick check: does this group contain any of the sold items?
           const relevantItems = sale.items.filter(i => i.groupId === group.id);
           if (relevantItems.length === 0) return group;

           const updatedVariants = group.variants.map(variant => {
             const soldItem = relevantItems.find(item => item.variantId === variant.id);
             if (soldItem) {
               return { ...variant, stockPieces: variant.stockPieces - soldItem.quantityPieces };
             }
             return variant;
           });
           return { ...group, variants: updatedVariants };
         }));
       }
       return { ...prev, nextInvoiceId: prev.nextInvoiceId + 1 };
    });
    notify('মেমো সফলভাবে সেভ হয়েছে', 'success');
  }, [currentUser, notify]);

  const handleUpdateSale = useCallback((updatedSale: Sale, restoreStock: boolean = false) => {
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    notify('মেমো আপডেট করা হয়েছে', 'success');
  }, [notify]);

  const handleInventoryUpdate = useCallback((newInventory: ProductGroup[]) => {
     setInventory(newInventory);
  }, []);

  const handleDeleteSale = useCallback((saleId: string) => {
    setSales(prevSales => {
       const sale = prevSales.find(s => s.id === saleId);
       if (!sale) return prevSales;

       if (sale.items.length > 0 && sale.items[0].groupId !== 'manual') {
          setInventory(prevInv => prevInv.map(group => {
             const relevantItems = sale.items.filter(i => i.groupId === group.id);
             if (relevantItems.length === 0) return group;

             const updatedVariants = group.variants.map(variant => {
                const soldItem = relevantItems.find(item => item.variantId === variant.id);
                if (soldItem) {
                   return { ...variant, stockPieces: variant.stockPieces + soldItem.quantityPieces };
                }
                return variant;
             });
             return { ...group, variants: updatedVariants };
          }));
       }
       return prevSales.filter(s => s.id !== saleId);
    });
    notify('মেমো ডিলিট এবং স্টক রিস্টোর করা হয়েছে', 'success');
  }, [notify]);

  const handleReturnItem = useCallback((saleId: string, itemIndex: number, returnQty: number) => {
     setSales(prevSales => prevSales.map(sale => {
        if (sale.id === saleId) {
           const newItems = [...sale.items];
           const item = newItems[itemIndex];
           const refundAmount = Math.round((item.subtotal / item.quantityPieces) * returnQty);
           
           if (item.groupId !== 'manual') {
              setInventory(prevInv => prevInv.map(g => {
                 if (g.id === item.groupId) {
                    return {
                       ...g,
                       variants: g.variants.map(v => v.id === item.variantId ? {...v, stockPieces: v.stockPieces + returnQty} : v)
                    }
                 }
                 return g;
              }));
           }

           const newItemQty = item.quantityPieces - returnQty;
           if (newItemQty <= 0) {
              newItems.splice(itemIndex, 1);
           } else {
              newItems[itemIndex] = {
                 ...item,
                 quantityPieces: newItemQty,
                 subtotal: item.subtotal - refundAmount,
                 formattedQty: `${newItemQty} pcs (Returned ${returnQty})`
              };
           }

           return {
              ...sale,
              items: newItems,
              subTotal: sale.subTotal - refundAmount,
              finalAmount: sale.finalAmount - refundAmount,
              dueAmount: (sale.finalAmount - refundAmount) - sale.paidAmount,
              note: (sale.note || '') + ` | Returned ${returnQty} of ${item.name}`
           };
        }
        return sale;
     }));
     notify('পণ্য ফেরত নেওয়া হয়েছে', 'success');
  }, [notify]);

  const handleStockEntry = useCallback((groupId: string, updatedVariants: any, log: StockLog) => {
     setInventory(prev => prev.map(g => g.id === groupId ? { ...g, variants: updatedVariants } : g));
     setStockLogs(prev => [log, ...prev]);
     notify('নতুন স্টক যোগ হয়েছে', 'success');
  }, [notify]);

  const handleGlobalCustomerUpdate = useCallback((oldName: string, oldPhone: string, newData: { name: string, phone: string, address: string }) => {
     setSales(prev => prev.map(s => {
        if (s.customerName === oldName && s.customerPhone === oldPhone) {
           return { ...s, customerName: newData.name, customerPhone: newData.phone, customerAddress: newData.address || s.customerAddress };
        }
        return s;
     }));
     notify('কাস্টমার তথ্য আপডেট হয়েছে', 'success');
  }, [notify]);

  const handleAddExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    notify('খরচ যোগ করা হয়েছে', 'success');
  }, [notify]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    notify('খরচ ডিলিট করা হয়েছে', 'success');
  }, [notify]);

  // --- Initial Loading Screen ---
  if (!isDataLoaded) {
     return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bangla animate-fade-in">
           <img src={LOGO_URL} alt="Logo" className="w-24 h-24 mb-6 opacity-80" />
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
           <h2 className="text-xl font-bold text-slate-700">সফটওয়্যার লোড হচ্ছে...</h2>
           <p className="text-slate-400 text-sm mt-2">অনুগ্রহ করে অপেক্ষা করুন</p>
        </div>
     );
  }

  // --- Auth View ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-bangla relative overflow-hidden">
        {/* Login Toast Container */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white font-bold flex items-center gap-2 animate-slide-in ${
              t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}>
              {t.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
              {t.msg}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative z-10">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl p-2">
              <img src={LOGO_URL} alt="Tinghor" className="w-full h-full object-contain" />
           </div>
           <h1 className="text-2xl font-bold text-slate-800 mb-2">টিনঘর.কম</h1>
           <p className="text-slate-500 mb-8">দোকান ম্যানেজমেন্ট সিস্টেমে স্বাগতম</p>
           
           <div className="space-y-4">
              <div className="text-left">
                 <label className="text-xs font-bold text-slate-400 uppercase">ইমেইল / আইডি</label>
                 <input 
                   type="text" 
                   className="w-full p-3 border rounded-lg outline-none focus:border-blue-600 mb-3"
                   value={loginEmail}
                   onChange={e => setLoginEmail(e.target.value)}
                   autoFocus
                 />
                 <label className="text-xs font-bold text-slate-400 uppercase">পাসওয়ার্ড</label>
                 <div className="relative">
                   <Lock className="w-4 h-4 absolute top-3.5 left-3 text-slate-400"/>
                   <input 
                    type="password" 
                    className="w-full pl-9 p-3 border rounded-lg outline-none focus:border-blue-600"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                  />
                 </div>
              </div>
              <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                লগিন করুন
              </button>
           </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  // --- Nav Button Component (Memoized for stability) ---
  const NavButton = React.memo(({ tab, icon: Icon, label, restricted }: any) => {
    if (restricted && !isAdmin) return null;
    return (
      <button
        onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
        className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all w-full text-left font-bangla text-lg ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <Icon className="w-6 h-6" /> <span className="font-semibold">{label}</span>
      </button>
    );
  });

  return (
    <LanguageContext.Provider value={{ lang, t }}>
      <ToastContext.Provider value={{ notify }}>
      <div className={`min-h-screen bg-slate-50 flex ${lang === 'bn' ? 'font-bangla' : 'font-sans'}`}>
        
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`px-6 py-4 rounded-xl shadow-2xl text-white font-bold flex items-center gap-3 animate-slide-in pointer-events-auto min-w-[300px] ${
              t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'
            }`}>
              {t.type === 'error' ? <AlertCircle className="w-6 h-6"/> : t.type === 'success' ? <CheckCircle className="w-6 h-6"/> : <Info className="w-6 h-6"/>}
              <span>{t.msg}</span>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <img src={LOGO_URL} alt="Tinghor" className="h-12 w-auto object-contain" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-500 bg-slate-100 p-2 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <nav className="p-6 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
            <NavButton tab="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavButton tab="pos" icon={ShoppingBag} label={t('pos')} />
            <NavButton tab="history" icon={FileText} label={t('history')} />
            <NavButton tab="ledger" icon={BookOpen} label={t('ledger')} />
            <NavButton tab="inventory" icon={Package} label={t('inventory')} />
            <NavButton tab="customers" icon={Users} label={t('customers')} />
            <NavButton tab="expenses" icon={Wallet} label={t('expenses')} />
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-6 text-xs font-bold text-slate-400 uppercase mb-2">Admin Area</p>
              <NavButton tab="reports" icon={PieChart} label={t('reports')} restricted={true} />
              <NavButton tab="salary" icon={UserCircle} label={t('salary')} restricted={true} />
              <NavButton tab="logs" icon={History} label={t('logs')} restricted={true} />
              <NavButton tab="settings" icon={Settings} label={t('settings')} restricted={true} />
            </div>
          </nav>
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
             <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{currentUser.name[0]}</div>
                <div className="flex-1"><p className="text-sm font-bold text-slate-700">{currentUser.name}</p><p className="text-xs text-slate-400 capitalize">{currentUser.role}</p></div>
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"><LogOut className="w-4 h-4" /></button>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8 overflow-x-hidden">
          <div className="flex justify-between items-center mb-8 bg-white p-4 lg:px-8 lg:py-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-lg"><Menu className="w-6 h-6 text-slate-600" /></button>
              <div className="lg:hidden">
                 <img src={LOGO_URL} alt="Tinghor" className="h-8 w-auto" />
              </div>
              <span className="hidden lg:block text-slate-500 font-medium font-bangla text-lg">
                {new Date().toLocaleDateString('bn-BD', { dateStyle: 'full', timeZone: 'Asia/Dhaka' })}
              </span>
            </div>
            <button onClick={() => setLang(l => l === 'en' ? 'bn' : 'en')} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition">
              <Languages className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-700">{lang === 'en' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>

          {activeTab === 'dashboard' && <MemoDashboard inventory={inventory} sales={sales} expenses={expenses} />}
          {activeTab === 'pos' && <MemoPOS inventory={inventory} onCompleteSale={handleCompleteSale} settings={settings} sales={sales} />}
          {activeTab === 'history' && <MemoSalesHistory sales={sales} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} inventory={inventory} setInventory={handleInventoryUpdate} settings={settings} />}
          {activeTab === 'inventory' && <MemoInventory inventory={inventory} setInventory={setInventory} settings={settings} setSettings={setSettings} stockLogs={stockLogs} onStockAdd={handleStockEntry} currentUser={currentUser} />}
          {activeTab === 'ledger' && <MemoLedger sales={sales} onUpdateSale={handleUpdateSale} onAddNewSale={handleCompleteSale} onReturnItem={handleReturnItem} />}
          {activeTab === 'customers' && <MemoCustomers sales={sales} onUpdateCustomer={handleGlobalCustomerUpdate} />}
          {activeTab === 'expenses' && <MemoExpenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />}
          
          {activeTab === 'reports' && isAdmin && <MemoReports sales={sales} expenses={expenses} />}
          {activeTab === 'salary' && isAdmin && (
             <MemoSalaryManager 
               employees={employees} 
               salaryRecords={salaryRecords} 
               attendance={attendance}
               onAddEmployee={(e) => setEmployees(prev => [...prev, e])} 
               onUpdateEmployee={(u) => setEmployees(prev => prev.map(e=>e.id===u.id?u:e))}
               onDeleteEmployee={(id) => setEmployees(prev => prev.filter(e=>e.id!==id))}
               onUpdateAttendance={(r) => {
                  setAttendance(prev => {
                     const existingIdx = prev.findIndex(a => a.employeeId === r.employeeId && a.date === r.date);
                     const newAtt = [...prev];
                     if(existingIdx>=0) newAtt[existingIdx] = r; else newAtt.push(r);
                     return newAtt;
                  });
               }}
               onAddRecord={(r) => {
                 setSalaryRecords(prev => [...prev, r]);
                 handleAddExpense({
                    id: `sal_${r.id}`,
                    reason: `${r.type === 'salary' ? 'বেতন' : 'অগ্রিম'} - ${r.employeeName}`,
                    amount: r.amount,
                    category: 'salary',
                    timestamp: r.date
                 });
               }}
               currentUser={currentUser}
             />
          )}
          {activeTab === 'logs' && isAdmin && <MemoActivityLogs logs={logs} />}
          {activeTab === 'settings' && isAdmin && (
             <MemoAdminSettings 
               settings={settings} 
               setSettings={setSettings} 
               users={users} 
               setUsers={setUsers} 
             />
          )}
        </main>
      </div>
      </ToastContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;