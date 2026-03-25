import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Edit2, Trash2, Eye, CheckCircle, Camera, Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui';

// Helper สำหรับแสดงรูปภาพ (ถ้าเป็น URL จาก Backend ให้เติม Base URL)
const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}${path}`;
};

const normalizeRole = (role) => {
    const value = (role || '').trim().toLowerCase();
    if (value === 'backoffice' || value === 'back-office') return 'Back-Office';
    if (value === 'fieldops' || value === 'field-ops') return 'Field-Ops';
    return role;
};

export function HRMDashboard() {
    const [staffList, setStaffList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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
            setIsLoading(true);
            const data = await api.get('/api/staff');
            const normalizedStaff = Array.isArray(data)
                ? data.map((staff) => ({
                    id: staff.staff_id,
                    username: staff.username,
                    name: staff.full_name,
                    contact: staff.contact_number,
                    title: staff.title_role,
                    role: normalizeRole(staff.staff_role),
                    area: staff.area || '-',
                    status: staff.status,
                    image: staff.profile_image,
                }))
                : [];
            setStaffList(normalizedStaff);
        } catch (error) {
            showToast(error.message || 'Unable to load staff list', 'error');
        } finally {
            setIsLoading(false);
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
                role: normalizeRole(formData.role),
                area: formData.area || '-',
                contact: formData.contact.trim() || '-',
                status: formData.status,
                username: formData.username.trim(),
                password: formData.password, // ส่งไปเฉพาะตอนมีค่า
                image: formData.image || null,
            };

            if (modalType === 'ADD') {
                await api.post('/api/add_new_staff', payload);
                showToast('เพิ่มพนักงานสำเร็จ!', 'success');
            } else if (modalType === 'EDIT') {
                await api.put('/api/edit_staff', {
                    ...payload,
                    staff_id: selectedStaff.id,
                });
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
            await api.delete(`/api/delete_staff/${selectedStaff.id}`);
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
        s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.area?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: staffList.length,
        onDuty: staffList.filter((staff) => staff.status === 'On Duty').length,
        offDuty: staffList.filter((staff) => staff.status === 'Off Duty').length,
        backoffice: staffList.filter((staff) => normalizeRole(staff.role) === 'Back-Office').length,
    };

    const selectedStaffDetail = staffList.find((staff) => staff.id === selectedStaffId) || null;

    // จัดการอัปโหลดรูปภาพ
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

            const result = await api.postForm('/api/upload_profile_image', form);
            
            setFormData((prev) => ({ ...prev, image: result.image_url }));
        } catch (error) {
            showToast(error.message || 'ไม่สามารถอัปโหลดรูปภาพได้', 'error');
        } finally {
            setIsUploadingImage(false);
            e.target.value = '';
        }
    };

    return (
        <>
            <section className="p-6 md:p-8">
                <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Staff Management (HRM)</h1>
                        <p className="mt-1 text-sm text-gray-500">จัดการรายชื่อเจ้าหน้าที่ สิทธิ์การใช้งาน และสถานะปัจจุบัน</p>
                    </div>
                    <Button onClick={() => openModal('ADD')} className="gap-2">
                        <Plus size={16} />
                        ลงทะเบียนพนักงานใหม่
                    </Button>
                </header>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-gray-500">
                            <Users size={16} />
                            <p className="text-sm font-medium">เจ้าหน้าที่ทั้งหมด</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600">
                            <UserCheck size={16} />
                            <p className="text-sm font-medium">On Duty</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-700">{stats.onDuty}</p>
                    </div>
                    <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-gray-600">
                            <UserX size={16} />
                            <p className="text-sm font-medium">Off Duty</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-700">{stats.offDuty}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-blue-600">
                            <ShieldCheck size={16} />
                            <p className="text-sm font-medium">Backoffice</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-700">{stats.backoffice}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Search
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, ตำแหน่ง, บทบาท หรือพื้นที่..."
                            className="h-10 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-20 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">เจ้าหน้าที่</th>
                                        <th className="px-4 py-3 font-semibold">บทบาท</th>
                                        <th className="px-4 py-3 font-semibold">สถานะ</th>
                                        <th className="px-4 py-3 font-semibold">ติดต่อ</th>
                                        <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td className="px-4 py-10 text-center text-gray-400" colSpan={5}>
                                                กำลังโหลดข้อมูลพนักงาน...
                                            </td>
                                        </tr>
                                    ) : filteredStaff.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                                                ไม่พบข้อมูลพนักงาน
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((staff) => (
                                            <tr
                                                key={staff.id}
                                                className={`cursor-pointer transition hover:bg-gray-50 ${selectedStaffId === staff.id ? 'bg-blue-50/60' : 'bg-white'}`}
                                                onClick={() => setSelectedStaffId(staff.id)}
                                            >
                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex items-center gap-3">
                                                        {staff.image ? (
                                                            <img src={getImageUrl(staff.image)} alt="Profile" className="h-10 w-10 rounded-full border-2 border-emerald-500/20 object-cover" />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold uppercase text-emerald-700">
                                                                {staff.name?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{staff.name}</p>
                                                            <p className="text-xs text-gray-500">{staff.title} • {staff.area}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{staff.role}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${staff.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{staff.contact || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); openModal('VIEW', staff); }} className="rounded-md p-1.5 text-gray-500 transition hover:bg-blue-100 hover:text-blue-700" title="ดูข้อมูล" type="button"><Eye size={15} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); openModal('EDIT', staff); }} className="rounded-md p-1.5 text-gray-500 transition hover:bg-amber-100 hover:text-amber-700" title="แก้ไข" type="button"><Edit2 size={15} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); openModal('DELETE', staff); }} className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700" title="ลบ" type="button"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Person Details</h2>
                        {!selectedStaffDetail ? (
                            <p className="text-sm text-gray-500">เลือกพนักงานจากตารางทางซ้ายเพื่อดูรายละเอียด</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {selectedStaffDetail.image ? (
                                        <img src={getImageUrl(selectedStaffDetail.image)} alt="Profile" className="h-14 w-14 rounded-full border-2 border-emerald-200 object-cover" />
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                                            {selectedStaffDetail.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">{selectedStaffDetail.name}</p>
                                        <p className="text-sm text-gray-500">{selectedStaffDetail.title || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Staff ID</p>
                                        <p className="mt-1 text-sm text-gray-800">STF-{selectedStaffDetail.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Username</p>
                                        <p className="mt-1 text-sm text-gray-800">{selectedStaffDetail.username || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</p>
                                        <p className="mt-1 text-sm text-gray-800">{selectedStaffDetail.role || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</p>
                                        <p className="mt-1 text-sm text-gray-800">{selectedStaffDetail.contact || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${selectedStaffDetail.status === 'On Duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {selectedStaffDetail.status || '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </section>

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
                                                    <option value="Back-Office">Back-Office (ส่วนกลาง)</option>
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
                                        <div><p className="text-gray-400 text-xs mb-1">Staff ID</p><p className="font-semibold">STF-{selectedStaff.id}</p></div>
                                        <div><p className="text-gray-400 text-xs mb-1">Username</p><p className="font-semibold">{selectedStaff.username}</p></div>
                                        <div><p className="text-gray-400 text-xs mb-1">Role</p><p className="font-semibold">{selectedStaff.role}</p></div>
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