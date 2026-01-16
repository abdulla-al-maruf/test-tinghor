
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { ProductGroup, StoreSettings, CalculationMode, StockLog, ProductVariant, User } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, Search, Save, AlertTriangle, Eye, EyeOff, Edit3 } from 'lucide-react';
import { ToastContext } from '../App';

interface InventoryProps {
  inventory: ProductGroup[];
  setInventory: React.Dispatch<React.SetStateAction<ProductGroup[]>>;
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  stockLogs?: StockLog[];
  onStockAdd?: (groupId: string, updatedVariants: ProductVariant[], log: StockLog) => void;
  currentUser: User | null;
}

// --- Memoized Individual Group Card to prevent re-rendering the whole list ---
const ProductGroupCard = React.memo(({ 
  group, 
  isExpanded, 
  onToggleExpand, 
  onDeleteGroup, 
  currentUser, 
  onStockUpdate, 
  inputStyle 
}: any) => {
  const [stockEntry, setStockEntry] = useState({
    length: 6,
    base: 72,
    buyPrice: 0, 
    qtyInput: '',
    qtyMode: 'bundle'
  });
  const [showCost, setShowCost] = useState<Record<string, boolean>>({}); 

  // Auto-fill price logic
  useEffect(() => {
    if (isExpanded) {
       const variant = group.variants.find((v: any) => v.lengthFeet === stockEntry.length);
       if (variant && variant.averageCost > 0) {
          setStockEntry(prev => ({ ...prev, buyPrice: Math.round(variant.averageCost) }));
       } else {
          setStockEntry(prev => ({ ...prev, buyPrice: 0 }));
       }
    }
  }, [stockEntry.length, isExpanded, group.variants]);

  const getBundleDisplay = (g: ProductGroup, v: ProductVariant) => {
     if (g.type === 'tin_bundle' && v.calculationBase) {
       return ((v.stockPieces * v.lengthFeet) / v.calculationBase).toFixed(2) + ' বান';
     }
     return '-';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition duration-300">
      <div 
        className="p-6 flex justify-between items-center cursor-pointer bg-slate-50 border-b border-slate-100 hover:bg-blue-50/50 transition group"
        onClick={() => onToggleExpand(group.id)}
      >
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm text-2xl font-bold 
             ${group.type === 'tin_bundle' ? 'bg-blue-100 text-blue-700' : 
               group.type === 'running_foot' ? 'bg-amber-100 text-amber-700' : 
               'bg-purple-100 text-purple-700'}`}>
            {group.brand[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-sm bg-slate-200 px-2 rounded-md font-medium text-slate-600">{group.productType}</span>
              {group.brand} 
              {group.color && group.color !== 'N/A' && <><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <span className="text-slate-600">{group.color}</span></>}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
               {group.thickness && group.thickness !== 'N/A' && group.thickness !== 'Standard' && <span className="text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded text-xs">{group.thickness}</span>}
               <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                 group.type === 'tin_bundle' ? 'border-blue-200 text-blue-600' : 
                 group.type === 'running_foot' ? 'border-amber-200 text-amber-600' : 
                 'border-purple-200 text-purple-600'
               }`}>
                  {group.type === 'tin_bundle' ? 'ঢেউ টিন' : group.type === 'running_foot' ? 'ফুট/শিট' : 'পিস'}
               </span>
               {group.customValues && Object.entries(group.customValues).map(([key, val]) => (
                  val && val !== 'N/A' && (
                     <span key={key} className="px-2 py-0.5 rounded text-xs font-medium border border-slate-200 text-slate-500 bg-white">
                        {key}: {val as string}
                     </span>
                  )
               ))}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
           {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-white animate-fade-in">
          {/* Add Stock Section */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
            <h4 className="font-bold text-slate-700 mb-5 flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-emerald-600" />
              স্টক এন্ট্রি (মাল ক্রয়)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-5 items-end">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">সাইজ (ফুট)</label>
                {group.type === 'tin_bundle' ? (
                  <select className={inputStyle} value={stockEntry.length} onChange={e => {
                     const l = Number(e.target.value);
                     setStockEntry(p => ({...p, length: l, base: l > 12 ? 70 : (l === 7 || l === 10 ? 70 : 72)}));
                  }}>
                     {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(n => <option key={n} value={n}>{n} ফুট</option>)}
                  </select>
                ) : (
                  <input type="number" className={inputStyle} value={stockEntry.length} onChange={e => setStockEntry(p => ({...p, length: Number(e.target.value)}))} placeholder="Size" />
                )}
              </div>

              {group.type === 'tin_bundle' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">বেস</label>
                  <input type="number" className={inputStyle} value={stockEntry.base} onChange={e => setStockEntry(p => ({...p, base: Number(e.target.value)}))} />
                </div>
              )}

              <div className="col-span-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">ক্রয় মূল্য</label>
                <input type="number" className={inputStyle} value={stockEntry.buyPrice || ''} onChange={e => setStockEntry(p => ({...p, buyPrice: Number(e.target.value)}))} placeholder="0" />
              </div>
              
              <div className="col-span-2 md:col-span-2">
                 <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">পরিমাণ</label>
                 <div className="relative">
                    <input type="number" placeholder="0" className={inputStyle + " pr-24"} value={stockEntry.qtyInput} onChange={e => setStockEntry(p => ({...p, qtyInput: e.target.value}))} />
                    {group.type === 'tin_bundle' && (
                      <div className="absolute right-2 top-2 bottom-2 flex bg-slate-100 rounded-lg p-1">
                         <button onClick={() => setStockEntry(p => ({...p, qtyMode: 'bundle'}))} className={`px-3 py-1 text-xs font-bold rounded-md transition ${stockEntry.qtyMode === 'bundle' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>বান</button>
                         <button onClick={() => setStockEntry(p => ({...p, qtyMode: 'piece'}))} className={`px-3 py-1 text-xs font-bold rounded-md transition ${stockEntry.qtyMode === 'piece' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>পিস</button>
                      </div>
                    )}
                 </div>
              </div>

              <div className="col-span-2 md:col-span-6 mt-2">
                 <button 
                   onClick={() => {
                      onStockUpdate(group.id, group.type, stockEntry);
                      setStockEntry(p => ({...p, qtyInput: '', buyPrice: 0}));
                   }}
                   className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-200"
                 >
                   <Save className="w-5 h-5" /> স্টক সেভ করুন
                 </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 text-sm font-bold uppercase tracking-wide">
                <tr>
                  <th className="p-4 whitespace-nowrap">সাইজ</th>
                  {group.type === 'tin_bundle' && <th className="p-4 whitespace-nowrap">বেস</th>}
                  <th className="p-4 whitespace-nowrap">মজুদ (পিস)</th>
                  {group.type === 'tin_bundle' && <th className="p-4 whitespace-nowrap">মজুদ (বান)</th>}
                  <th className="p-4 whitespace-nowrap">ক্রয় মূল্য</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 font-medium divide-y divide-slate-100">
                {group.variants.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">{v.lengthFeet}'</td>
                    {group.type === 'tin_bundle' && <td className="p-4 text-slate-500">{v.calculationBase}</td>}
                    <td className="p-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">{v.stockPieces}</span></td>
                    {group.type === 'tin_bundle' ? <td className="p-4 text-slate-500">{getBundleDisplay(group, v)}</td> : group.type === 'tin_bundle' ? null : <td className="p-4 text-slate-400">-</td>}
                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-2">
                        {showCost[v.id] ? <span className="font-bold text-slate-900">৳{(v.averageCost || 0).toFixed(2)} /পিস</span> : <span className="text-slate-400 text-sm italic">Hidden</span>}
                        <button onClick={() => setShowCost(p => ({...p, [v.id]: !p[v.id]}))} className="text-slate-400 hover:text-blue-600">
                          {showCost[v.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {group.variants.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">কোন স্টক নেই</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => onDeleteGroup(group)} className="text-red-500 px-4 py-2 hover:bg-red-50 rounded-lg text-sm font-bold transition flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> এই পেজ ডিলিট করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export const Inventory: React.FC<InventoryProps> = ({ inventory, setInventory, settings, onStockAdd, currentUser }) => {
  const { notify } = useContext(ToastContext);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<ProductGroup>>({
    productType: settings.productTypes[0] || 'ঢেউ টিন',
    brand: settings.brands[0] || '',
    color: settings.colors[0] || '',
    thickness: settings.thicknesses[0] || '',
    type: 'tin_bundle', 
    customValues: {}, 
    variants: []
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    targetId: string | null;
    targetName: string;
    typedName: string;
  }>({ isOpen: false, targetId: null, targetName: '', typedName: '' });

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Memoize filtered groups to allow instant search typing without re-rendering everything
  const filteredGroups = useMemo(() => {
    return inventory.filter(g => 
      g.productType?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.thickness.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.color.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleCreateGroup = () => {
    if (!newGroup.brand || !newGroup.productType) {
       notify("পণ্যের ধরন এবং ব্র্যান্ড আবশ্যক", "error");
       return;
    }

    const group: ProductGroup = {
      id: Date.now().toString(),
      productType: newGroup.productType || 'অন্যান্য',
      brand: newGroup.brand,
      color: newGroup.color || 'N/A',
      thickness: newGroup.thickness || 'Standard',
      type: newGroup.type || 'tin_bundle',
      customValues: newGroup.customValues || {},
      variants: []
    };
    setInventory(prev => [...prev, group]);
    setIsCreatingGroup(false);
    notify("নতুন ক্যাটাগরি তৈরি হয়েছে", "success");
  };

  const handleStockUpdate = (groupId: string, groupType: CalculationMode, stockEntry: any) => {
    const qty = Number(stockEntry.qtyInput);
    const incomingRate = Number(stockEntry.buyPrice);

    if (!qty) { notify("পরিমাণ দেওয়া আবশ্যক", "error"); return; }
    if (incomingRate === 0 && !confirm("ক্রয় মূল্য ০ (শুন্য) টাকা দেওয়া হয়েছে। আপনি কি নিশ্চিত?")) return;

    let piecesToAdd = 0;
    const { base, length } = stockEntry;

    if (groupType === 'tin_bundle') {
       if (stockEntry.qtyMode === 'bundle') {
         piecesToAdd = Math.round((qty * base) / length);
       } else {
         piecesToAdd = qty;
       }
    } else {
       piecesToAdd = qty; 
    }

    // Logic to update variants locally to prepare for onStockAdd call
    const group = inventory.find(g => g.id === groupId);
    if (!group) return;

    const existingIndex = group.variants.findIndex(v => v.lengthFeet === length);
    let updatedVariants = [...group.variants];

    if (existingIndex >= 0) {
      const currentStock = updatedVariants[existingIndex].stockPieces;
      const currentAvgCost = updatedVariants[existingIndex].averageCost || 0;
      
      const totalCurrentValue = currentStock * currentAvgCost;
      let incomingCostPerPiece = 0;
      
      if (groupType === 'tin_bundle') {
          if (stockEntry.qtyMode === 'bundle') {
            const totalIncomingCost = qty * incomingRate;
            incomingCostPerPiece = totalIncomingCost / piecesToAdd;
          } else {
            const equivalentBundles = (piecesToAdd * length) / base;
            const totalIncomingCost = equivalentBundles * incomingRate;
            incomingCostPerPiece = totalIncomingCost / piecesToAdd;
          }
      } else if (groupType === 'running_foot') {
          const totalFeet = piecesToAdd * length;
          const totalIncomingCost = totalFeet * incomingRate;
          incomingCostPerPiece = totalIncomingCost / piecesToAdd;
      } else {
          incomingCostPerPiece = incomingRate;
      }

      const totalIncomingValue = piecesToAdd * incomingCostPerPiece;
      const newTotalStock = currentStock + piecesToAdd;
      const newAvgCost = (totalCurrentValue + totalIncomingValue) / newTotalStock;

      updatedVariants[existingIndex] = {
        ...updatedVariants[existingIndex],
        stockPieces: newTotalStock,
        averageCost: newAvgCost, 
        calculationBase: groupType === 'tin_bundle' ? base : undefined
      };
    } else {
      let initialCostPerPiece = 0;
      if (groupType === 'tin_bundle') {
          if (stockEntry.qtyMode === 'bundle') {
            initialCostPerPiece = (qty * incomingRate) / piecesToAdd;
          } else {
            const equivalentBundles = (piecesToAdd * length) / base;
            initialCostPerPiece = (equivalentBundles * incomingRate) / piecesToAdd;
          }
      } else if (groupType === 'running_foot') {
          initialCostPerPiece = (piecesToAdd * length * incomingRate) / piecesToAdd;
      } else {
          initialCostPerPiece = incomingRate;
      }

      updatedVariants.push({
        id: Date.now().toString(),
        lengthFeet: length,
        calculationBase: groupType === 'tin_bundle' ? base : undefined,
        stockPieces: piecesToAdd,
        averageCost: initialCostPerPiece
      });
    }
    updatedVariants.sort((a, b) => a.lengthFeet - b.lengthFeet);

    if (onStockAdd) {
       const log: StockLog = {
          id: Date.now().toString(),
          date: Date.now(),
          productName: `${group.brand} ${group.thickness} ${group.color} (${length}')`,
          quantityAdded: piecesToAdd,
          costPrice: incomingRate,
          newStockLevel: existingIndex >= 0 ? updatedVariants[existingIndex].stockPieces : piecesToAdd,
          note: 'Manual Entry'
       };
       onStockAdd(groupId, updatedVariants, log);
    }
  };

  const initiateDeleteGroup = (group: ProductGroup) => {
    setDeleteModal({
      isOpen: true,
      targetId: group.id,
      targetName: `${group.brand} ${group.color}`,
      typedName: ''
    });
  };

  const executeDelete = () => {
    if (deleteModal.targetId) {
      setInventory(prev => prev.filter(g => g.id !== deleteModal.targetId));
      notify("পেজ ডিলিট করা হয়েছে", "success");
    }
    setDeleteModal({ isOpen: false, targetId: null, targetName: '', typedName: '' });
  };

  const inputStyle = "w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium";

  return (
    <div className="space-y-8 font-bangla">
      
      {/* Safety Deletion Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">আপনি কি নিশ্চিত?</h3>
                 <p className="text-slate-600 mb-6 text-sm">
                   ডিলিট করলে এই তথ্য আর ফেরত পাওয়া যাবে না। নিশ্চিত করতে নিচের বক্সে <span className="font-bold text-red-600 px-1 bg-red-50 rounded select-all">"{deleteModal.targetName}"</span> লিখুন।
                 </p>
                 
                 <input 
                   type="text" 
                   className={inputStyle + " text-center border-red-200 focus:ring-red-500 mb-4"}
                   placeholder="নামটি এখানে লিখুন..."
                   value={deleteModal.typedName}
                   onChange={e => setDeleteModal({...deleteModal, typedName: e.target.value})}
                   autoFocus
                 />

                 <div className="flex gap-3">
                    <button 
                      onClick={() => setDeleteModal({ isOpen: false, targetId: null, targetName: '', typedName: '' })}
                      className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={executeDelete}
                      disabled={deleteModal.typedName !== deleteModal.targetName}
                      className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                    >
                      ডিলিট করুন
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="খাতায় খুঁজুন (নাম/টাইপ)..." 
            className={inputStyle + " pl-12"}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsCreatingGroup(true)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Plus className="w-6 h-6" />
            নতুন পণ্য / পেজ
          </button>
        </div>
      </div>

      {/* New Group Creator */}
      {isCreatingGroup && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            নতুন পণ্য যোগ করুন
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
             {/* Type Selector */}
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">১. পণ্যের ধরন (Product Type)</label>
                <select className={inputStyle} value={newGroup.productType} onChange={e => setNewGroup({...newGroup, productType: e.target.value})}>
                   {settings.productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">হিসাবের ধরন (Calculation Logic)</label>
               <div className="flex gap-2">
                 <button 
                    onClick={() => setNewGroup({...newGroup, type: 'tin_bundle'})}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${newGroup.type === 'tin_bundle' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                 >
                   টিন (বান্ডিল)
                 </button>
                 <button 
                    onClick={() => setNewGroup({...newGroup, type: 'running_foot'})}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${newGroup.type === 'running_foot' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                 >
                   ফুট / শিট
                 </button>
                 <button 
                    onClick={() => setNewGroup({...newGroup, type: 'fixed_piece'})}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${newGroup.type === 'fixed_piece' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
                 >
                   পিস / সংখ্যা
                 </button>
               </div>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">ব্র্যান্ড</label>
               <select className={inputStyle} value={newGroup.brand} onChange={e => setNewGroup({...newGroup, brand: e.target.value})}>
                  <option value="">সিলেক্ট করুন</option>
                  {settings.brands.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">কালার</label>
               <select className={inputStyle} value={newGroup.color} onChange={e => setNewGroup({...newGroup, color: e.target.value})}>
                  <option value="">সিলেক্ট করুন (বা খালি রাখুন)</option>
                  {settings.colors.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">থিকনেস</label>
               <select className={inputStyle} value={newGroup.thickness} onChange={e => setNewGroup({...newGroup, thickness: e.target.value})}>
                  <option value="">সিলেক্ট করুন (বা খালি রাখুন)</option>
                  {settings.thicknesses.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             
             {/* Dynamic Fields Rendering */}
             {settings.customFields?.map(field => (
                <div key={field.id}>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{field.name}</label>
                   <select 
                     className={inputStyle} 
                     value={newGroup.customValues?.[field.name] || ''} 
                     onChange={e => setNewGroup({
                        ...newGroup, 
                        customValues: { ...newGroup.customValues, [field.name]: e.target.value } 
                     })}
                   >
                      <option value="">অপশনাল...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                </div>
             ))}

             <div className="flex gap-3 items-end col-span-full md:col-span-1">
               <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">সেভ করুন</button>
               <button onClick={() => setIsCreatingGroup(false)} className="px-6 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">বাতিল</button>
             </div>
          </div>
        </div>
      )}

      {/* Inventory Groups List - Optimized Rendering */}
      <div className="grid grid-cols-1 gap-6">
        {filteredGroups.map(group => (
          <ProductGroupCard 
             key={group.id} 
             group={group} 
             isExpanded={editingGroupId === group.id}
             onToggleExpand={setEditingGroupId}
             onDeleteGroup={initiateDeleteGroup}
             currentUser={currentUser}
             onStockUpdate={handleStockUpdate}
             inputStyle={inputStyle}
          />
        ))}
        {filteredGroups.length === 0 && (
           <div className="text-center py-20 text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>কোনো পণ্য পাওয়া যায়নি</p>
           </div>
        )}
      </div>
    </div>
  );
};
