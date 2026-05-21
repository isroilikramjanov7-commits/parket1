import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingCart, 
  Search, 
  FileText, 
  Package, 
  TrendingUp, 
  DollarSign,
  Layers,
  X,
  History,
  Archive,
  BarChart3,
  Calendar,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const API_BASE = 'https://parket-1.onrender.com/api';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade">
      <div className="glass-card w-full max-w-md mb-0 shadow-2xl scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="mb-0 text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = React.useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      alert("Kameraga ruxsat berilmadi yoki kamera topilmadi");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg');
    onCapture(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade">
      <div className="w-full max-w-lg bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/20">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-[50vh] object-cover bg-gray-900"
        />
        <div className="p-8 flex justify-between items-center bg-zinc-900 border-t border-white/10">
          <button 
            type="button"
            onClick={onClose} 
            className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-all"
          >
            <div className="p-4 bg-white/10 rounded-full"><X size={24}/></div>
            <span className="text-xs font-medium">Yopish</span>
          </button>
          <button 
            type="button"
            onClick={capture} 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20 group-hover:scale-110 transition-all">
              <div className="w-12 h-12 bg-white rounded-full border-2 border-black/10 shadow-inner"/>
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-tighter">Rasmga olish</span>
          </button>
          <div className="w-16"/> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products_db');
    return saved ? JSON.parse(saved) : [];
  });
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sales_db');
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    code: '', name: '', size: '', quantity: '', costUsd: '', saleUsd: '', dollarRate: '12500', category: 'luxury', imageUrl: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  const [sellModal, setSellModal] = useState({ isOpen: false, product: null, mode: 'piece', value: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('products_db', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sales_db', JSON.stringify(sales));
  }, [sales]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      ...formData,
      id: editingId || Date.now(),
      size: parseFloat(formData.size),
      quantity: parseFloat(formData.quantity),
      costUsd: parseFloat(formData.costUsd),
      saleUsd: parseFloat(formData.saleUsd),
      dollarRate: parseFloat(formData.dollarRate)
    };

    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? newProduct : p));
      setEditingId(null);
    } else {
      setProducts([...products, newProduct]);
    }

    setFormData({
      code: '', name: '', size: '', quantity: '', costUsd: '', saleUsd: '', dollarRate: '12500', category: 'luxury', imageUrl: ''
    });
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      code: product.code, 
      name: product.name, 
      size: product.size.toString(), 
      quantity: product.quantity.toString(),
      costUsd: product.costUsd.toString(), 
      saleUsd: product.saleUsd.toString(), 
      dollarRate: product.dollarRate.toString(), 
      category: product.category, 
      imageUrl: product.imageUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = () => {
    setProducts(products.filter(p => p.id !== deleteModal.productId));
    setDeleteModal({ isOpen: false, productId: null });
  };

  const confirmSell = () => {
    const { product, mode, value } = sellModal;
    const val = parseFloat(value);
    if (!val || val <= 0) return alert('Miqdorni kiriting');

    const qty = mode === 'piece' ? val : val / product.size;
    const area = mode === 'piece' ? val * product.size : val;

    if (qty > product.quantity) return alert('Omborda yetarli emas!');

    const saleSom = product.saleUsd * product.dollarRate;
    const sumUsd = area * product.saleUsd;
    const sumSom = area * saleSom;

    // Update product quantity
    setProducts(products.map(p => {
      if (p.id === product.id) {
        return { ...p, quantity: p.quantity - qty };
      }
      return p;
    }));

    // Add to sales record
    const newSale = {
      id: Date.now(),
      productCode: product.code,
      productName: product.name,
      qty,
      area,
      sumSom,
      sumUsd,
      time: new Date().toLocaleString('uz-UZ')
    };
    setSales([newSale, ...sales]);
    setSellModal({ ...sellModal, isOpen: false, value: '' });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Parket CRM Hisoboti', 14, 15);
    const tableColumn = ["Sana", "Kod", "Nomi", "Dona", "Maydon", "Summa $", "Summa S"];
    const tableRows = sales.map(s => [
      s.time, s.productCode || '-', s.productName, Math.round(s.qty), s.area.toFixed(3), s.sumUsd.toFixed(2), s.sumSom.toLocaleString()
    ]);
    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save(`hisobot_${new Date().toLocaleDateString()}.pdf`);
  };

  const filteredProducts = products.filter(p => 
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalValueUsd: products.reduce((acc, p) => acc + (p.quantity * p.size * p.saleUsd), 0),
    totalSalesUsd: sales.reduce((acc, s) => acc + s.sumUsd, 0),
    totalArea: products.reduce((acc, p) => acc + (p.quantity * p.size), 0),
    productCount: products.length
  };

  return (
    <div className="app-container">
      {/* Modals */}
      <Modal isOpen={sellModal.isOpen} onClose={() => setSellModal({ ...sellModal, isOpen: false })} title={sellModal.mode === 'piece' ? 'Dona sotish' : 'Kvadrat sotish'}>
        <div className="bg-white/5 p-4 rounded-lg mb-4">
          <p className="text-sm text-muted">Mahsulot: <span className="text-white font-medium">{sellModal.product?.name}</span></p>
          <p className="text-sm text-muted">Mavjud: <span className="text-white font-medium">{sellModal.product?.quantity.toFixed(1)} dona</span></p>
        </div>
        <input type="number" value={sellModal.value} onChange={(e) => setSellModal({ ...sellModal, value: e.target.value })} placeholder={sellModal.mode === 'piece' ? 'Dona soni' : 'm² miqdori'} autoFocus />
        <button onClick={confirmSell} className="btn-primary w-full py-4 text-lg">Sotuvni yakunlash</button>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, productId: null })} title="O'chirishni tasdiqlang">
        <p className="text-muted mb-8 text-center text-lg">Haqiqatan ham ushbu mahsulotni tizimdan butkul o'chirmoqchimisiz?</p>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setDeleteModal({ isOpen: false, productId: null })} className="bg-white/5 hover:bg-white/10 rounded-xl">Bekor qilish</button>
          <button onClick={confirmDelete} className="btn-danger py-4">Ha, O'chirish</button>
        </div>
      </Modal>

      {/* 1. Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 animate-up">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">💎 PARKET CRM</h1>
          <p className="text-muted mt-2 text-lg">Professional ombor boshqaruv tizimi</p>
        </div>
        <button onClick={generatePDF} className="btn-success px-8 py-4 shadow-xl">
          <FileText size={22} /> PDF HISOBOT
        </button>
      </header>

      {/* 2. Stats Dashboard */}
      <div className="stats-grid animate-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card flex items-center justify-between group">
          <div>
            <p className="text-muted text-sm uppercase tracking-widest font-bold">Jami Sotuv</p>
            <p className="text-3xl font-black mt-1 text-success">${stats.totalSalesUsd.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-success/10 rounded-2xl group-hover:scale-110 transition-transform"><BarChart3 size={32} className="text-success" /></div>
        </div>
        <div className="glass-card flex items-center justify-between group">
          <div>
            <p className="text-muted text-sm uppercase tracking-widest font-bold">Jami Kvadrat</p>
            <p className="text-3xl font-black mt-1 text-primary">{stats.totalArea.toFixed(2)} m²</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform"><Layers size={32} className="text-primary" /></div>
        </div>
        <div className="glass-card flex items-center justify-between group">
          <div>
            <p className="text-muted text-sm uppercase tracking-widest font-bold">Ombor Qiymati</p>
            <p className="text-3xl font-black mt-1 text-secondary">${stats.totalValueUsd.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-secondary/10 rounded-2xl group-hover:scale-110 transition-transform"><DollarSign size={32} className="text-secondary" /></div>
        </div>
      </div>

      {/* 3. Form (Inputs) - Now below stats and spanning full width */}
      <section className="animate-up mb-12" style={{ animationDelay: '0.2s' }}>
        <div className="glass-card">
          <h2 className="flex items-center gap-3"><Plus className="text-primary" /> {editingId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <input name="code" value={formData.code} onChange={handleInputChange} placeholder="Kodi" required className="mb-0" />
            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nomi" required className="mb-0" />
            <input name="size" type="number" step="0.0001" value={formData.size} onChange={handleInputChange} placeholder="O'lcham (m²)" required className="mb-0" />
            <input name="quantity" type="number" step="0.0001" value={formData.quantity} onChange={handleInputChange} placeholder="Miqdori (dona)" required className="mb-0" />
            <input name="costUsd" type="number" step="0.01" value={formData.costUsd} onChange={handleInputChange} placeholder="Olish ($)" className="mb-0" />
            <input name="saleUsd" type="number" step="0.01" value={formData.saleUsd} onChange={handleInputChange} placeholder="Sotish ($)" className="mb-0" />
            <input name="dollarRate" type="number" value={formData.dollarRate} onChange={handleInputChange} placeholder="$ Kursi" className="mb-0" />
            <select name="category" value={formData.category} onChange={handleInputChange} className="mb-0">
              <option value="luxury">Luxury</option>
              <option value="golden_art_floor">Golden Art Floor</option>
            </select>
            
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setCameraModalOpen(true)}
                  className="btn-success py-3 px-2 text-xs flex items-center justify-center gap-2"
                >
                  <Camera size={16} /> Kamera
                </button>
                <button 
                  type="button"
                  onClick={() => document.getElementById('gallery-input').click()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-2 text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} /> Galereya
                </button>
                <input 
                  id="gallery-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>
              {formData.imageUrl && (
                <div className="relative w-full h-24 bg-gray-100 rounded-xl overflow-hidden border-2 border-primary/20">
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, imageUrl: ''})} 
                    className="absolute top-1 right-1 p-1.5 bg-danger rounded-full text-white shadow-lg"
                  >
                    <X size={14}/>
                  </button>
                </div>
              )}
            </div>
            <div className="lg:col-span-4 flex gap-4 mt-2">
              <button type="submit" className="btn-primary flex-1 py-4">
                {editingId ? 'O\'zgarishlarni saqlash' : 'Omborga qo\'shish'}
              </button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="glass-card mb-0 py-4 px-10 border-white/20">Bekor qilish</button>}
            </div>
          </form>
        </div>
      </section>

      {/* 4. Products & Search */}
      <main className="flex flex-col gap-10 animate-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input className="pl-12 py-5 text-lg rounded-2xl mb-0 shadow-lg" placeholder="Qidirish (kod yoki nom)..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 whitespace-nowrap">
            <Calendar size={18} className="text-muted" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {['luxury', 'golden_art_floor'].map(cat => (
          <div key={cat} className="glass-card p-0 overflow-hidden border-t-4 border-indigo-500">
            <div className="px-6 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <h2 className="mb-0 flex items-center gap-3">
                <Archive className={cat === 'luxury' ? 'text-accent' : 'text-success'} /> 
                {cat === 'luxury' ? 'Luxury Collection' : 'Golden Art Floor'}
              </h2>
              <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{filteredProducts.filter(p => p.category === cat).length} turdagi mahsulot</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Rasm</th><th>Kod</th><th>Mahsulot</th><th>Omborda</th><th>Sotish Narxi</th><th>Amallar</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.filter(p => p.category === cat).map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-gray-200" alt="Product" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td><span className={`badge ${cat === 'luxury' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{p.code}</span></td>
                      <td><div className="font-bold">{p.name}</div><div className="text-xs text-muted">m²: {p.size}</div></td>
                      <td><div className="font-bold">{Math.round(p.quantity)} dona</div><div className="text-xs text-muted">{(p.quantity * p.size).toFixed(2)} m²</div></td>
                      <td><div className="font-bold text-success">${p.saleUsd}</div><div className="text-xs text-muted">{(p.saleUsd * p.dollarRate).toLocaleString()} so'm</div></td>
                      <td>
                        <div className="flex gap-2">
                           <button onClick={() => setSellModal({ isOpen: true, product: p, mode: 'area', value: '' })} className="px-3 py-2 text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg">m² sotish</button>
                           <button onClick={() => setSellModal({ isOpen: true, product: p, mode: 'piece', value: '' })} className="px-3 py-2 text-xs bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg">Dona sotish</button>
                           <button onClick={() => handleEdit(p)} className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-white transition-all"><Edit3 size={18}/></button>
                           <button onClick={() => setDeleteModal({ isOpen: true, productId: p.id })} className="p-2 hover:bg-danger/10 rounded-lg text-muted hover:text-danger transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* History Table */}
        <div className="glass-card p-0 overflow-hidden mb-20 border-t-4 border-emerald-500/50">
          <div className="px-6 py-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <History className="text-success" /> <h2 className="mb-0">Oxirgi sotuvlar tarixi</h2>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Sana va Vaqt</th><th>Mahsulot</th><th>Miqdor</th><th>Qiymati $</th><th>Qiymati So'm</th></tr></thead>
              <tbody>
                {sales.slice(0, 10).map(s => (
                  <tr key={s.id}>
                    <td className="text-muted text-xs">{s.time}</td>
                    <td><div className="font-bold">{s.productName}</div><div className="text-xs text-muted">{s.productCode}</div></td>
                    <td><span className="font-bold">{Math.round(s.qty)} dona</span> <span className="text-muted">({s.area.toFixed(2)} m²)</span></td>
                    <td className="text-success font-black">${s.sumUsd.toFixed(2)}</td>
                    <td className="font-medium text-indigo-300">{s.sumSom.toLocaleString()} so'm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CameraModal 
        isOpen={cameraModalOpen} 
        onClose={() => setCameraModalOpen(false)} 
        onCapture={(img) => setFormData({ ...formData, imageUrl: img })} 
      />

      <style>{`
        .animate-fade { animation: fadeIn 0.3s ease-out; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .fixed { position: fixed; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .z-50 { z-index: 50; }
        .backdrop-blur-md { backdrop-filter: blur(8px); }
        .bg-black/60 { background-color: rgba(0, 0, 0, 0.6); }
        .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
        .from-indigo-400 { --tw-gradient-from: #818cf8; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(129, 140, 248, 0)); }
        .to-pink-500 { --tw-gradient-to: #ec4899; }
        .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
        .text-transparent { color: transparent; }
      `}</style>
    </div>
  );
};

export default App;
