
import React, { useState, useEffect, useContext } from 'react';
import { ProductGroup, ProductVariant, CartItem, Sale, StoreSettings } from '../types';
import { ShoppingCart, CheckCircle, Trash, Layers, Tag, Calculator, User, Phone, Truck, FileText, MapPin, Save, PenTool, AlertCircle } from 'lucide-react';
import { ToastContext } from '../App';

interface POSProps {
  inventory: ProductGroup[];
  onCompleteSale: (sale: Sale) => void;
  settings: StoreSettings;
  sales: Sale[]; // Kept for interface compatibility, but not used for heavy lifting anymore
}

export const POS: React.FC<POSProps> = ({ inventory, onCompleteSale, settings }) => {
  const { notify } = useContext(ToastContext);
  
  // -- State Initialization with LocalStorage (Auto-Save) --
  // SAFE PARSING IMPLEMENTED
  const [cart, setCart] = useState<CartItem[]>(() => {
     try {
       const saved = localStorage.getItem('pos_draft_cart');
       return saved ? JSON.parse(saved) : [];
     } catch (e) {
       console.error("Failed to parse draft cart", e);
       localStorage.removeItem('pos_draft_cart'); // Auto-clean bad data
       return [];
     }
  });
  
  const [customerName, setCustomerName] = useState(() => {
    try { return localStorage.getItem('pos_draft_name') || ''; } catch { return ''; }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try { return localStorage.getItem('pos_draft_phone') || ''; } catch { return ''; }
  });
  const [customerAddress, setCustomerAddress] = useState(() => {
    try { return localStorage.getItem('pos_draft_address') || ''; } catch { return ''; }
  });
  
  // -- Regular State --
  const [selProductType, setSelProductType] = useState<string>(''); 
  const [selBrand, setSelBrand] = useState<string>('');             
  const [selThickness, setSelThickness] = useState<string>('');     
  const [selColor, setSelColor] = useState<string>('');             
  const [selSize, setSelSize] = useState<number | null>(null);      

  // Manual Entry State (For "Others")
  const [manualName, setManualName] = useState('');

  // Input States
  const [quantity, setQuantity] = useState<string>('');
  const [sellingRate, setSellingRate] = useState<string>(''); 
  const [unitMode, setUnitMode] = useState<'bundle' | 'piece'>('piece'); 
  
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [deliveryStatus, setDeliveryStatus] = useState<'delivered' | 'pending'>('delivered');
  const [saleNote, setSaleNote] = useState('');

  // --- Auto Save Effect ---
  useEffect(() => {
    const timer = setInterval(() => {
       try {
         localStorage.setItem('pos_draft_cart', JSON.stringify(cart));
         localStorage.setItem('pos_draft_name', customerName);
         localStorage.setItem('pos_draft_phone', customerPhone);
         localStorage.setItem('pos_draft_address', customerAddress);
       } catch (e) {
         console.error("Auto-save failed", e);
       }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(timer);
  }, [cart, customerName, customerPhone, customerAddress]);

  // Initial Selection Logic
  useEffect(() => {
     if (!selProductType && settings.productTypes.length > 0) {
        setSelProductType(settings.productTypes[0]); 
     }
  }, [settings.productTypes]);

  // --- Derived Calculations ---
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartFinal = cartTotal - (Number(discountAmount)||0);
  const due = cartFinal - (Number(paidAmount)||0);

  // --- Auto Update Paid Amount ---
  useEffect(() => {
     setPaidAmount(cartFinal.toString());
  }, [cartFinal]);

  // --- Filtering Logic (Inventory) ---
  const isManualMode = selProductType === 'অন্যান্য';

  const availableBrands = Array.from(new Set(
     inventory.filter(g => !selProductType || g.productType === selProductType)
              .map(g => g.brand)
  ));

  const availableThicknesses = Array.from(new Set(
    inventory.filter(g => 
      (!selProductType || g.productType === selProductType) && 
      (!selBrand || g.brand === selBrand)
    ).map(g => g.thickness)
  )).filter(Boolean);

  const availableColors = Array.from(new Set(
    inventory.filter(g => 
      (!selProductType || g.productType === selProductType) &&
      (!selBrand || g.brand === selBrand) && 
      (!selThickness || g.thickness === selThickness)
    ).map(g => g.color)
  )).filter(Boolean);

  const targetGroup = !isManualMode ? inventory.find(g => 
    g.productType === selProductType &&
    g.brand === selBrand && 
    (availableThicknesses.length === 0 || g.thickness === selThickness) && 
    (availableColors.length === 0 || g.color === selColor)
  ) : null;

  const availableSizes = targetGroup ? targetGroup.variants.map(v => v.lengthFeet).sort((a,b)=>a-b) : [];
  const targetVariant = targetGroup?.variants.find(v => v.lengthFeet === selSize);

  useEffect(() => {
    setSellingRate(''); 
    if (targetVariant) setUnitMode('piece'); 
  }, [targetVariant, targetGroup]);

  // --- Actions ---

  const handleAddToCart = () => {
    const qtyNum = Number(quantity);
    const rateNum = Number(sellingRate); // This is ALWAYS "Rate per Bundle" for Tins if type is tin_bundle

    if (!quantity || qtyNum <= 0) {
       notify('পরিমাণ (Quantity) লিখুন', 'error');
       return;
    }
    if (!sellingRate || rateNum <= 0) {
       notify('বিক্রয় মূল্য (Rate) লিখুন', 'error');
       return;
    }

    if (isManualMode) {
       if (!manualName) {
          notify('পণ্যের নাম লিখুন', 'error');
          return;
       }

       setCart([...cart, {
          groupId: 'manual',
          variantId: `manual_${Date.now()}`,
          name: manualName,
          lengthFeet: 0,
          quantityPieces: qtyNum,
          subtotal: Math.round(qtyNum * rateNum),
          formattedQty: `${qtyNum} pcs`,
          priceUnit: rateNum,
          buyPriceUnit: 0, 
          unitType: 'piece',
          calculationBase: 0
       }]);

       setManualName('');
       setQuantity('');
       setSellingRate('');
       notify('অন্যান্য পণ্য যোগ হয়েছে', 'success');
       return;
    }

    if (!targetGroup || !targetVariant) {
       notify('দয়া করে সব অপশন সিলেক্ট করুন', 'error');
       return;
    }

    let qtyPieces = 0;
    let finalPrice = 0;
    let formattedQty = '';

    if (targetGroup.type === 'tin_bundle') {
       // Logic Update: 'rateNum' is always Price Per Bundle
       const base = targetVariant.calculationBase || 72;
       const length = targetVariant.lengthFeet;
       const piecesPerBundle = base / length; 

       if (unitMode === 'bundle') {
          // Selling as Bundles
          qtyPieces = Math.round(qtyNum * piecesPerBundle);
          finalPrice = Math.round(qtyNum * rateNum);
          formattedQty = `${qtyNum} বান`;
       } else {
          // Selling as Pieces
          // Formula: (Pieces * BundleRate) / PiecesPerBundle
          qtyPieces = qtyNum;
          finalPrice = Math.round((qtyNum * rateNum) / piecesPerBundle);
          formattedQty = `${qtyNum} পিস`;
       }
    } else if (targetGroup.type === 'running_foot') {
       qtyPieces = qtyNum;
       const totalFeet = qtyPieces * targetVariant.lengthFeet;
       finalPrice = Math.round(totalFeet * rateNum); 
       formattedQty = `${qtyPieces} pcs (${totalFeet} ft)`;
    } else {
       qtyPieces = qtyNum;
       finalPrice = Math.round(qtyPieces * rateNum);
       formattedQty = `${qtyPieces} pcs`;
    }

    if (qtyPieces > targetVariant.stockPieces) {
      notify(`স্টক নেই! আছে মাত্র ${targetVariant.stockPieces} পিস।`, 'error');
      return;
    }

    const thicknessStr = targetGroup.thickness && targetGroup.thickness !== 'N/A' && targetGroup.thickness !== 'Standard' ? targetGroup.thickness : '';
    const colorStr = targetGroup.color && targetGroup.color !== 'N/A' ? targetGroup.color : '';
    
    // Structured Name
    const itemName = `${targetGroup.productType} | ${targetGroup.brand} | ${thicknessStr} ${colorStr} | ${targetVariant.lengthFeet}'`.replace(/\s+/g, ' ').trim();

    setCart([...cart, {
      groupId: targetGroup.id,
      variantId: targetVariant.id,
      name: itemName,
      lengthFeet: targetVariant.lengthFeet,
      calculationBase: targetVariant.calculationBase,
      quantityPieces: qtyPieces,
      subtotal: finalPrice,
      unitType: targetGroup.type === 'tin_bundle' ? unitMode : 'piece',
      formattedQty: formattedQty,
      priceUnit: rateNum, 
      buyPriceUnit: targetVariant.averageCost || 0 
    }]);

    setQuantity('');
    notify('কার্টে যোগ হয়েছে', 'success');
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
       notify('কার্ট খালি!', 'error');
       return;
    }
    if (!customerName) {
      notify('কাস্টমারের নাম লিখুন (আবশ্যক)', 'error');
      return;
    }
    
    if (due > 0 && (!customerPhone || customerPhone.length < 11)) {
       notify('বাকি থাকলে মোবাইল নাম্বার অবশ্যই দিতে হবে', 'error');
       return;
    }

    const subTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Number(discountAmount) || 0;
    const final = subTotal - discount;
    const paid = Number(paidAmount) || 0;
    const currentDue = final - paid;

    onCompleteSale({
      id: Date.now().toString(),
      invoiceId: 'PENDING', 
      customerName,
      customerPhone: customerPhone || 'N/A',
      customerAddress,
      items: cart,
      subTotal,
      discount,
      finalAmount: final,
      paidAmount: paid,
      dueAmount: currentDue, 
      timestamp: Date.now(),
      paymentHistory: paid > 0 ? [{ amount: paid, date: Date.now(), note: 'Initial' }] : [],
      deliveryStatus,
      soldBy: 'POS',
      note: saleNote
    });

    // Clear Draft
    localStorage.removeItem('pos_draft_cart');
    localStorage.removeItem('pos_draft_name');
    localStorage.removeItem('pos_draft_phone');
    localStorage.removeItem('pos_draft_address');

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPaidAmount('');
    setDiscountAmount('');
    setSaleNote('');
    setDeliveryStatus('delivered');
  };

  const renderItemName = (name: string) => {
     if (!name.includes('|')) return <div className="font-bold text-slate-800 text-base">{name}</div>;
     
     const parts = name.split('|').map(s => s.trim());

     return (
        <div className="flex flex-col items-start gap-1">
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-1.5 rounded uppercase tracking-wider">{parts[0]}</span>
              <span className="text-sm font-extrabold text-blue-700">{parts[1]}</span>
           </div>
           <div className="flex items-center gap-2">
               {parts[2] && <span className="text-xs font-medium bg-slate-50 border border-slate-200 px-1.5 rounded text-slate-600">{parts[2]}</span>}
               {parts[3] && <span className="text-sm font-bold text-slate-800 bg-yellow-100 px-1.5 rounded border border-yellow-200">{parts[3]}</span>}
           </div>
        </div>
     );
  };

  const getBtnClass = (active: boolean) => `
    px-5 py-3 rounded-xl border text-sm font-bold transition-all shadow-sm
    ${active 
      ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105' 
      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:shadow-md'
    }
  `;
  
  const inputStyle = "w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-bold";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full font-bangla">
      
      {/* Left: Product Selector */}
      <div className="xl:col-span-7 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse">
             <Save className="w-3 h-3"/> অটো সেভ চালু
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Layers className="w-5 h-5 text-blue-600" />
            পণ্য নির্বাচন করুন
          </h3>

          {/* 1. PRODUCT TYPE TABS */}
          <div className="mb-6">
             <div className="flex gap-2 bg-slate-100 p-2 rounded-xl overflow-x-auto pb-2 snap-x">
               {settings.productTypes.map(type => (
                 <button 
                   key={type}
                   onClick={() => {
                     setSelProductType(type);
                     setSelBrand(''); setSelThickness(''); setSelColor(''); setSelSize(null);
                     setManualName('');
                   }}
                   className={`flex-none py-3 px-6 rounded-lg text-sm font-bold transition whitespace-nowrap snap-center ${
                     selProductType === type 
                     ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' 
                     : 'text-slate-500 hover:bg-slate-200'
                   }`}
                 >
                   {type}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-8 animate-fade-in">
             
             {isManualMode ? (
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 animate-fade-in">
                   <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                     <PenTool className="w-5 h-5"/> ম্যানুয়াল এন্ট্রি
                   </h4>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">পণ্যের নাম (বিবরণ)</label>
                      <input 
                        type="text" 
                        className={inputStyle}
                        placeholder="পণ্যের নাম লিখুন"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        autoFocus
                      />
                   </div>
                </div>
             ) : (
             <>
             {/* 2. Brand */}
             {availableBrands.length > 0 && (
               <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">ব্র্যান্ড (কোম্পানি)</label>
                  <div className="flex flex-wrap gap-3">
                     {availableBrands.map(b => (
                       <button
                         key={b}
                         onClick={() => { setSelBrand(b); setSelThickness(''); setSelColor(''); setSelSize(null); }}
                         className={getBtnClass(selBrand === b)}
                       >
                         {b}
                       </button>
                     ))}
                  </div>
               </div>
             )}

             {/* 3. Thickness */}
             {selBrand && availableThicknesses.length > 0 && (
               <div className="animate-fade-in">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">মিলি / থিকনেস</label>
                  <div className="flex flex-wrap gap-3">
                     {availableThicknesses.map(t => (
                       <button
                         key={t}
                         onClick={() => { setSelThickness(t); setSelColor(''); setSelSize(null); }}
                         className={getBtnClass(selThickness === t)}
                       >
                         {t}
                       </button>
                     ))}
                  </div>
               </div>
             )}

             {/* 4. Color */}
             {(selBrand && (availableThicknesses.length === 0 || selThickness) && availableColors.length > 0) && (
               <div className="animate-fade-in">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">কালার</label>
                  <div className="flex flex-wrap gap-3">
                     {availableColors.map(c => (
                       <button
                         key={c}
                         onClick={() => { setSelColor(c); setSelSize(null); }}
                         className={getBtnClass(selColor === c)}
                       >
                         {c}
                       </button>
                     ))}
                  </div>
               </div>
             )}

             {/* 5. Size Selection */}
             {((availableThicknesses.length === 0 || selThickness) && (availableColors.length === 0 || selColor) && selBrand) && (
               <div className="animate-fade-in p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">সাইজ / মাপ (ফুট)</label>
                  {availableSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                       {availableSizes.map(s => (
                         <button
                           key={s}
                           onClick={() => setSelSize(s)}
                           className={`w-20 h-20 rounded-2xl border-2 text-2xl font-bold transition flex items-center justify-center shadow-sm
                             ${selSize === s 
                               ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110' 
                               : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                             }`}
                         >
                           {s}'
                         </button>
                       ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-red-500 font-bold mb-2">স্টক নেই</p>
                      <p className="text-xs text-slate-400">এই কম্বিনেশনের কোনো পণ্য ইনভেন্টরিতে নেই।</p>
                    </div>
                  )}
               </div>
             )}
             </>
             )}
          </div>
        </div>

        {/* Quantity Panel */}
        {(targetVariant || isManualMode) && (
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden border border-slate-700">
             <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             
             <div className="flex flex-col md:flex-row gap-8 items-end relative z-10">
                 <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold uppercase tracking-wide text-xs">
                      <CheckCircle className="w-4 h-4" />
                      নির্বাচিত পণ্য
                    </div>
                    {isManualMode ? (
                        <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">
                           {manualName || 'পণের নাম লিখুন...'}
                           <span className="text-slate-400 text-sm block mb-1">অন্যান্য (ম্যানুয়াল এন্ট্রি)</span>
                        </h4>
                    ) : (
                        <div className="flex flex-col gap-1">
                           <span className="bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded w-fit">{targetGroup?.productType}</span>
                           <h4 className="text-3xl font-bold text-white tracking-tight">{targetGroup?.brand}</h4>
                           <div className="flex gap-2 text-slate-300 text-sm">
                              {targetGroup?.color && targetGroup.color !== 'N/A' && <span>{targetGroup.color}</span>}
                              {targetGroup?.thickness && targetGroup.thickness !== 'N/A' && targetGroup.thickness !== 'Standard' && <span className="text-yellow-400">{targetGroup.thickness}</span>}
                           </div>
                        </div>
                    )}
                    
                    {!isManualMode && targetVariant && (
                        <div className="inline-flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 shadow-sm mt-3">
                        <span className="text-sm">সাইজ: <b className="text-yellow-400 text-lg">{targetVariant.lengthFeet}'</b></span>
                        <span className="h-5 w-px bg-slate-600"></span>
                        <span className="text-sm">স্টক: <b className="text-white">{targetVariant.stockPieces}</b> pcs</span>
                        </div>
                    )}
                 </div>

                 <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-32">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                         <Tag className="w-3 h-3" /> 
                         {/* Correct Label Logic */}
                         {targetGroup?.type === 'tin_bundle' ? 'রেট (প্রতি বান)' : targetGroup?.type === 'running_foot' ? 'রেট (ফুট)' : 'রেট (পিস)'}
                      </label>
                      <input 
                        type="number" 
                        className="w-full p-4 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition shadow-inner"
                        placeholder="Rate"
                        value={sellingRate}
                        onChange={e => setSellingRate(e.target.value)}
                      />
                    </div>

                    <div className="w-48">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                         <Calculator className="w-3 h-3" /> পরিমাণ
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full p-4 rounded-xl bg-white text-slate-900 font-bold text-xl outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
                          placeholder="0"
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                        />
                        {targetGroup?.type === 'tin_bundle' && (
                          <div className="absolute right-2 top-2 bottom-2 flex bg-slate-100 rounded-lg p-1">
                             <button 
                               onClick={() => setUnitMode('bundle')} 
                               className={`px-3 text-[10px] font-bold rounded-md transition ${unitMode === 'bundle' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                             >
                               বান
                             </button>
                             <button 
                               onClick={() => setUnitMode('piece')} 
                               className={`px-3 text-[10px] font-bold rounded-md transition ${unitMode === 'piece' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                             >
                               পিস
                             </button>
                          </div>
                        )}
                        {targetGroup?.type !== 'tin_bundle' && !isManualMode && (
                           <div className="absolute right-4 top-4 text-sm font-bold text-slate-400">pcs</div>
                        )}
                      </div>
                    </div>
                 </div>

                 <button onClick={handleAddToCart} className="bg-emerald-500 text-emerald-950 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 h-[60px]">
                   যোগ করুন
                 </button>
             </div>
          </div>
        )}
      </div>

      {/* Right: Cart Summary */}
      <div className="xl:col-span-5 flex flex-col h-full gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
            <span className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" /> কার্ট লিস্ট
            </span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{cart.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
             {cart.map((item, idx) => (
               <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-2 relative group hover:border-blue-400 transition hover:shadow-md">
                  <div className="flex justify-between items-start">
                     <div>
                        {renderItemName(item.name)}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs font-bold text-slate-600">
                            {item.formattedQty}
                          </span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="font-bold text-slate-900 text-lg">৳{Math.round(item.subtotal).toLocaleString()}</div>
                        <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-1 bg-slate-50 px-2 py-1 rounded-full inline-flex">
                           <Tag className="w-3 h-3" /> @৳{Math.round(item.priceUnit).toLocaleString()}
                        </div>
                     </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(idx)} 
                    className="absolute -top-2 -right-2 bg-white text-red-500 p-2 rounded-full shadow border border-slate-200 opacity-0 group-hover:opacity-100 transition hover:bg-red-500 hover:text-white"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
               </div>
             ))}
             {cart.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 pb-10">
                  <ShoppingCart className="w-10 h-10 opacity-30 mb-4" />
                  <p className="font-medium">কার্টে কোনো পণ্য নেই</p>
               </div>
             )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
           {/* Customer Info */}
           <div className="grid grid-cols-2 gap-4 mb-3 relative">
              <div className="order-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> ক্রেতার নাম <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="নাম লিখুন" 
                  autoFocus 
                />
              </div>
              <div className="order-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                   <Phone className="w-3 h-3" /> মোবাইল <span className="text-slate-400 text-[9px]">(বাকি থাকলে বাধ্যতামূলক)</span>
                </label>
                <input 
                  type="text" 
                  className={`${inputStyle} ${due > 0 && !customerPhone ? 'border-red-300 ring-1 ring-red-200 bg-red-50' : ''}`}
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  placeholder="017..." 
                />
              </div>
           </div>
           
           <div className="mt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> ঠিকানা
                 </label>
                 <input type="text" className={inputStyle} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="গ্রাম/মহল্লা, থানা..." />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> ডেলিভারি
                    </label>
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                       <button onClick={() => setDeliveryStatus('delivered')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${deliveryStatus === 'delivered' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>Delivered</button>
                       <button onClick={() => setDeliveryStatus('pending')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${deliveryStatus === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>Pending</button>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> নোট
                    </label>
                    <input type="text" className={inputStyle + " py-2.5"} value={saleNote} onChange={e => setSaleNote(e.target.value)} placeholder="ছোট নোট..." />
                 </div>
               </div>
               
               <div className="flex justify-between items-center">
                  <span className="text-slate-600 flex items-center gap-1 cursor-pointer font-medium text-sm" title="Discount/Waiver">
                     <Tag className="w-4 h-4" /> মওকুফ / ছাড় (-)
                  </span>
                  <input 
                     type="number" 
                     className="w-28 text-right border-b-2 border-slate-300 focus:border-red-500 outline-none text-red-600 font-bold bg-transparent text-lg" 
                     value={discountAmount} 
                     onChange={e => setDiscountAmount(e.target.value)} 
                     placeholder="0" 
                  />
               </div>
           </div>
           
           <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
              <div className="flex justify-between items-center text-slate-600">
                 <span className="font-medium">মোট বিল</span>
                 <span className="font-bold text-slate-800">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-200 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-800">সর্বমোট প্রদেয়</span>
                <span className="text-3xl font-bold text-slate-900">৳{cartFinal.toLocaleString()}</span>
              </div>
           </div>

           <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-bold text-xs block mb-1">জমা (Paid)</span>
                <input 
                  type="number" 
                  className="w-full bg-white p-2 rounded-lg border border-emerald-200 font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 text-lg" 
                  value={paidAmount} 
                  onChange={e => setPaidAmount(e.target.value)} 
                  placeholder="0" 
                />
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col justify-center text-right">
                <span className="text-red-800 font-bold text-xs block mb-1">বাকি (Due)</span>
                <span className="text-xl font-bold text-red-600 block">৳{(cartFinal - (Number(paidAmount)||0)).toLocaleString()}</span>
              </div>
           </div>

           {due > 0 && (!customerPhone || customerPhone.length < 11) && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse">
                 <AlertCircle className="w-4 h-4"/> বাকি থাকলে মোবাইল নাম্বার দিতে হবে
              </div>
           )}

           <button 
             onClick={handleCheckout} 
             disabled={cart.length === 0}
             className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition flex justify-center gap-3 items-center disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
           >
             <CheckCircle className="w-6 h-6" /> টাকা বুঝিয়ে পেলাম (Confirm)
           </button>
        </div>
      </div>
    </div>
  );
};
