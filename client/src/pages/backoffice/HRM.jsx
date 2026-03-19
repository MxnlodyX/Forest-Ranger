import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Edit2, Trash2, Eye, CheckCircle, Camera } from 'lucide-react';
import { api } from '../../services/api';

// Helper สำหรับแสดงรูปภาพ (ถ้าเป็น URL จาก Backend ให้เติม Base URL)
const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}${path}`;
};

export function HRMDashboard() {
    const [staffList, setStaffList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Modal & Toast States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [toastState, setToastState] = useState({ message: '', type: 'success' });

    // Form State
    const [formData, setFormData] = useState({
        name: '', title: '', role: 'Field-Ops', area: '', contact: '', status: 'Off Duty', username: '', password: '', image: null
    });

    // ดึงข้อมูลพนักงาน
    const fetchStaff = async () => {
        try {
            const data = await api.get('/api/staff');
            setStaffList(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast(error.message || 'Unable to load staff list', 'error');
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    // เปิด Modal
    const openModal = (type, staff = null) => {
        setModalType(type);
        setSelectedStaff(staff);
        if (staff && (type === 'EDIT' || type === 'VIEW')) {
            setFormData({ ...staff, password: '' }); // ล้างรหัสผ่านไว้ เผื่อไม่อยากแก้
        } else {
            setFormData({ name: '', title: '', role: 'Field-Ops', area: 'Headquarters', contact: '', status: 'Off Duty', username: '', password: '', image: null });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    // แสดงแจ้งเตือน
    const showToast = (message, type = 'success') => {
        setToastState({ message, type });
        setTimeout(() => setToastState({ message: '', type: 'success' }), 3000);
    };

    // จัดการ Submit (Add / Edit)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isUploadingImage) {
            showToast('กำลังอัปโหลดรูปภาพ กรุณารอสักครู่...', 'error');
            return;
        }

        // ตรวจสอบฟิลด์บังคับ
        if (!formData.name || !formData.username || !formData.title || !formData.role) {
            showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
            return;
        }

        if (modalType === 'ADD' && !formData.password) {
            showToast('กรุณากำหนดรหัสผ่านสำหรับพนักงานใหม่', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                name: formData.name.trim(),
                title: formData.title.trim(),
                role: formData.role,
                area: formData.area || '-',
                contact: formData.contact.trim() || '-',
                status: formData.status,
                username: formData.username.trim(),
                password: formData.password, // ส่งไปเฉพาะตอนมีค่า
                image: formData.image || null,
            };

            if (modalType === 'ADD') {
                await api.post('/api/staff', payload);
                showToast('เพิ่มพนักงานสำเร็จ!', 'success');
            } else if (modalType === 'EDIT') {
                await api.put(`/api/staff/${selectedStaff.id}`, payload);
                showToast('อัปเดตข้อมูลพนักงานสำเร็จ!', 'success');
            }
            
            fetchStaff();
            closeModal();
        } catch (error) {
            showToast(error.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // จัดการลบข้อมูล
    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/api/staff/${selectedStaff.id}`);
            showToast('ลบพนักงานสำเร็จ', 'success');
            fetchStaff();
            closeModal();
        } catch (error) {
            showToast(error.message || 'ไม่สามารถลบข้อมูลได้', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ฟิลเตอร์ข้อมูลตาม Search
    const filteredStaff = staffList.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // จัดการอัปโหลดรูปภาพโดยไม่พึ่ง api.postForm
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.type)) {
            showToast('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น', 'error');
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
            e.target.value = '';
            return;
        }

        try {
            setIsUploadingImage(true);
            const form = new FormData();
            form.append('image', file);

            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
            // ใช้ fetch โดยตรงเพื่อส่ง multipart/form-data
            const res = await fetch(`${baseUrl}/api/upload`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) throw new Error('Upload failed');
            const result = await res.json();
            
            setFormData((prev) => ({ ...prev, image: result.image_url }));
            showToast('อัปโหลดรูปภาพสำเร็จ', 'success');
        } catch (error) {
            showToast('ไม่สามารถอัปโหลดรูปภาพได้', 'error');
        } finally {
            setIsUploadingImage(false);
            e.target.value = '';
        }
    };

    return (
        <>
            <header className="p-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management (HRM)</h1>
                    <p className="text-sm text-gray-500 mt-1">จัดการรายชื่อเจ้าหน้าที่ สิทธิ์การใช้งาน และสถานะปัจจุบัน</p>
                </div>
            </header>

            <div className="px-8 pb-8">
                {/* Search and Add Staff */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, ตำแหน่ง หรือพื้นที่..."
                            className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={() => openModal('ADD')} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium transition-all shadow-sm shadow-emerald-600/20">
                        <Plus size={16} /> <span>ลงทะเบียนพนักงานใหม่</span>
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-500 w-1/2">ข้อมูลพนักงาน</h3>
                        <div className="w-1/2 flex justify-between text-sm font-semibold text-gray-500">
                            <span className="w-1/3 text-center">บทบาท</span>
                            <span className="w-1/3 text-center">สถานะ</span>
                            <span className="w-1/3 text-right">จัดการ</span>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {filteredStaff.map(staff => (
                            <div key={staff.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center space-x-4 w-1/2">
                                    {staff.image ? (
                                        <img src={getImageUrl(staff.image)} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/20" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase">
                                            {staff.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-900 font-medium">{staff.name}</p>
                                        <p className="text-xs text-gray-500">{staff.title} • {staff.area}</p>
                                    </div>
                                </div>
                                <div className="w-1/2 flex items-center justify-between">
                                    <div className="w-1/3 text-sm text-gray-600 text-center">{staff.role}</div>
                                    <div className="w-1/3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${staff.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {staff.status}
                                        </span>
                                    </div>
                                    <div className="w-1/3 flex justify-end space-x-1 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal('VIEW', staff)} className="p-2 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-700 transition-colors" title="ดูข้อมูล"><Eye size={16} /></button>
                                        <button onClick={() => openModal('EDIT', staff)} className="p-2 hover:bg-amber-100 rounded-lg text-gray-500 hover:text-amber-700 transition-colors" title="แก้ไข"><Edit2 size={16} /></button>
                                        <button onClick={() => openModal('DELETE', staff)} className="p-2 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="ลบ"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredStaff.length === 0 && (
                            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลพนักงาน</div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {modalType === 'ADD' && 'ลงทะเบียนพนักงานใหม่'}
                                    {modalType === 'EDIT' && 'แก้ไขข้อมูลพนักงาน'}
                                    {modalType === 'VIEW' && 'ข้อมูลส่วนตัวพนักงาน'}
                                    {modalType === 'DELETE' && 'ยืนยันการลบข้อมูล'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"><X size={18} /></button>
                        </div>

                        {/* Modal Body: ADD / EDIT */}
                        {(modalType === 'ADD' || modalType === 'EDIT') && (
                            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
                                <div className="p-6 space-y-6">
                                    
                                    {/* --- Image Upload --- */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                            {formData.image ? (
                                                <img src={getImageUrl(formData.image)} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                                    <Camera size={24} className="mb-1" />
                                                    <span className="text-[10px] font-medium">Upload</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/png, image/jpeg, image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} disabled={isUploadingImage} />
                                        </div>
                                        {isUploadingImage && <p className="text-xs text-emerald-600 mt-2">กำลังอัปโหลด...</p>}
                                    </div>

                                    {/* --- Account Setup --- */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">บัญชีผู้ใช้งาน (Login)</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Username *</label>
                                                <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="ตั้งชื่อผู้ใช้งาน" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Password {modalType === 'EDIT' && '(เว้นว่างถ้าไม่แก้)'}</label>
                                                <input type="password" required={modalType === 'ADD'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Info --- */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">ข้อมูลเบื้องต้น</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ-สกุล *</label>
                                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="ชื่อ นามสกุล" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">เบอร์ติดต่อ</label>
                                                <input type="text" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="08X-XXX-XXXX" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">ตำแหน่ง (Title) *</label>
                                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="เช่น Ranger" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">พื้นที่รับผิดชอบ</label>
                                                <input type="text" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="เช่น เขต 1" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">ระดับสิทธิ์ (Role) *</label>
                                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30">
                                                    <option value="Field-Ops">Field-Ops (ภาคสนาม)</option>
                                                    <option value="Backoffice">Backoffice (ส่วนกลาง)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">สถานะปัจจุบัน</label>
                                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border-gray-300 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30">
                                                    <option value="On Duty">🟢 On Duty (เข้าเวร)</option>
                                                    <option value="Off Duty">⚪ Off Duty (ออกเวร)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">ยกเลิก</button>
                                    <button type="submit" disabled={isSubmitting || isUploadingImage} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50">
                                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Modal Body: VIEW */}
                        {modalType === 'VIEW' && selectedStaff && (
                            <div>
                                <div className="p-6">
                                    <div className="flex items-center space-x-4 mb-6">
                                        {selectedStaff.image ? (
                                            <img src={getImageUrl(selectedStaff.image)} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-emerald-50" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                                                {selectedStaff.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h3>
                                            <p className="text-emerald-600 font-medium text-sm">{selectedStaff.title}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div><p className="text-gray-400 text-xs mb-1">Username</p><p className="font-semibold">{selectedStaff.username}</p></div>
                                        <div><p className="text-gray-400 text-xs mb-1">Role</p><p className="font-semibold">{selectedStaff.role}</p></div>
                                        <div><p className="text-gray-400 text-xs mb-1">Area</p><p className="font-semibold">{selectedStaff.area}</p></div>
                                        <div><p className="text-gray-400 text-xs mb-1">Contact</p><p className="font-semibold">{selectedStaff.contact}</p></div>
                                        <div className="col-span-2">
                                            <p className="text-gray-400 text-xs mb-1">Status</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${selectedStaff.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>{selectedStaff.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                                    <button onClick={closeModal} className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium">ปิด</button>
                                </div>
                            </div>
                        )}

                        {/* Modal Body: DELETE Confirm */}
                        {modalType === 'DELETE' && selectedStaff && (
                            <div>
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
                                        <Trash2 size={32} />
                                    </div>
                                    <p className="text-gray-600 mb-2">คุณแน่ใจหรือไม่ที่จะลบพนักงาน:</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedStaff.name}</p>
                                    <p className="text-sm text-red-500 mt-4">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                                </div>
                                <div className="p-4 border-t border-gray-100 flex justify-center gap-3 bg-gray-50">
                                    <button onClick={closeModal} className="px-6 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-100 text-sm font-medium">ยกเลิก</button>
                                    <button onClick={handleDelete} disabled={isSubmitting} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm">
                                        {isSubmitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Alerts */}
            {toastState.message && (
                <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 z-50 text-white ${toastState.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                    <CheckCircle size={20} className={toastState.type === 'error' ? 'text-red-200' : 'text-emerald-200'} />
                    <div>
                        <p className="text-sm font-bold">{toastState.type === 'error' ? 'ข้อผิดพลาด' : 'สำเร็จ'}</p>
                        <p className="text-xs">{toastState.message}</p>
                    </div>
                </div>
            )}
        </>
    );
}