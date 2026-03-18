import React, { useState } from 'react';
import { Archive, Plus, Search, Edit2, Trash2, UserCheck, X } from 'lucide-react';

export function InventoryPage() {
  // Mock Data เริ่มต้น
  const [items, setItems] = useState([
    { id: '1', assetId: 'MASK-001', name: 'N95 Respirator Mask', category: 'PPE', status: 'Available', assignee: '', notes: 'New batch' },
    { id: '2', assetId: 'MASK-002', name: 'N95 Respirator Mask', category: 'PPE', status: 'In Use', assignee: 'สมชาย รักดี', notes: 'เบิกไปไซต์ A' },
    { id: '3', assetId: 'DRILL-001', name: 'สว่านไฟฟ้า Bosch', category: 'Tools', status: 'Maintenance', assignee: '', notes: 'ส่งซ่อมมอเตอร์' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // States สำหรับฟอร์มจัดการ (Create/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // States สำหรับฟอร์มจัดการสถานะ (Assign/Status)
  const [isStatusFormOpen, setIsStatusFormOpen] = useState(false);

  // Form State หลัก
  const [formData, setFormData] = useState({
    assetId: '', name: '', category: 'PPE', status: 'Available', assignee: '', notes: ''
  });

  // ฟังก์ชันคำนวณสถิติ
  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'Available').length,
    inUse: items.filter(i => i.status === 'In Use').length,
    maintenance: items.filter(i => i.status === 'Maintenance').length,
  };

  // --- CRUD Functions ---
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Update
      setItems(prevItems => prevItems.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item));
    } else {
      // Create
      setItems((prevItems) => {
        const nextNumericId = prevItems.reduce((maxId, item) => {
          const currentId = Number(item.id);
          return Number.isFinite(currentId) ? Math.max(maxId, currentId) : maxId;
        }, 0) + 1;

        return [{ ...formData, id: nextNumericId.toString() }, ...prevItems];
      });
    }
    closeForms();
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์ชิ้นนี้?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // --- UI Helpers ---
  const openCreateForm = () => {
    setFormData({ assetId: '', name: '', category: 'PPE', status: 'Available', assignee: '', notes: '' });
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormData(item);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openStatusForm = (item) => {
    setFormData(item);
    setEditingItem(item);
    setIsStatusFormOpen(true);
  };

  const closeForms = () => {
    setIsFormOpen(false);
    setIsStatusFormOpen(false);
    setEditingItem(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'In Use': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter items by search
  const filteredItems = items.filter(item => 
    item.assetId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.assignee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="p-8 mx-auto">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการอุปกรณ์รายชิ้น ระบุสถานะ และผู้ใช้งานปัจจุบัน</p>
        </div>
        <button 
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> ลงทะเบียนอุปกรณ์ใหม่
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'อุปกรณ์ทั้งหมด', value: stats.total, color: 'border-gray-200' },
          { label: 'พร้อมใช้งาน', value: stats.available, color: 'border-green-200 text-green-700' },
          { label: 'ถูกใช้งานอยู่', value: stats.inUse, color: 'border-blue-200 text-blue-700' },
          { label: 'ส่งซ่อม', value: stats.maintenance, color: 'border-red-200 text-red-700' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white p-4 rounded-xl border ${stat.color} shadow-sm`}>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text"
          placeholder="ค้นหาจาก รหัสอุปกรณ์, ชื่อ, หรือผู้ใช้งาน..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full outline-none text-sm text-gray-700"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold">รหัสอุปกรณ์ (Unique ID)</th>
                <th className="p-4 font-semibold">ชื่ออุปกรณ์</th>
                <th className="p-4 font-semibold">สถานะ</th>
                <th className="p-4 font-semibold">ผู้ใช้งานปัจจุบัน</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <Archive size={32} className="mx-auto text-gray-300 mb-2" />
                    ไม่พบข้อมูลอุปกรณ์
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{item.assetId}</td>
                    <td className="p-4 text-gray-700">{item.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">
                      {item.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {item.assignee.charAt(0)}
                          </div>
                          {item.assignee}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      {/* ปุ่มเปลี่ยนสถานะ/มอบหมายงาน (Highlight Feature) */}
                      <button 
                        onClick={() => openStatusForm(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="อัปเดตสถานะ/ผู้ใช้งาน"
                      >
                        <UserCheck size={18} />
                      </button>
                      {/* ปุ่มแก้ไขข้อมูลพื้นฐาน */}
                      <button 
                        onClick={() => openEditForm(item)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 size={18} />
                      </button>
                      {/* ปุ่มลบ */}
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Modal 1: Create / Edit Base Info */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg">{editingItem ? 'แก้ไขอุปกรณ์' : 'ลงทะเบียนอุปกรณ์ใหม่'}</h3>
              <button onClick={closeForms} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสอุปกรณ์ (Unique ID) *</label>
                <input required type="text" value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="เช่น MASK-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่ออุปกรณ์ *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="เช่น N95 Respirator" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                  <option value="PPE">PPE (อุปกรณ์ป้องกัน)</option>
                  <option value="Tools">Tools (เครื่องมือช่าง)</option>
                  <option value="IT">IT (อุปกรณ์คอมพิวเตอร์)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeForms} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Status & Assignee Update */}
      {isStatusFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg">จัดการสถานะ / ผู้เบิก</h3>
              <button onClick={closeForms} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveItem} className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-center">
                <p className="text-xs text-gray-500">กำลังจัดการอุปกรณ์</p>
                <p className="font-semibold text-gray-900">{formData.assetId} - {formData.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะปัจจุบัน</label>
                <select value={formData.status} onChange={e => {
                  const newStatus = e.target.value;
                  // Auto-clear assignee if status is not 'In Use'
                  setFormData({...formData, status: newStatus, assignee: newStatus !== 'In Use' ? '' : formData.assignee});
                }} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                  <option value="Available">🟢 พร้อมใช้งาน (Available)</option>
                  <option value="In Use">🔵 กำลังใช้งาน (In Use)</option>
                  <option value="Maintenance">🔴 ส่งซ่อม (Maintenance)</option>
                </select>
              </div>

              {/* แสดงช่องชื่อผู้เบิกก็ต่อเมื่อสถานะเป็น In Use */}
              {formData.status === 'In Use' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้เบิกใช้งาน *</label>
                  <input required type="text" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="ระบุชื่อพนักงาน..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" rows="2" placeholder="เช่น สถานที่นำไปใช้, อาการเสีย..."></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeForms} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">อัปเดตสถานะ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}