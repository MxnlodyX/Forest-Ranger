import React, { useEffect, useState } from 'react';
import {
    Search, Plus, X, Edit2, Trash2, Eye, CheckCircle, Camera
} from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/api';

function mapApiStaffToUi(staff) {
    return {
        id: staff.staff_id,
        name: staff.full_name,
        title: staff.title_role,
        role: staff.staff_role,
        area: '-',
        contact: staff.contact_number || '-',
        status: staff.status,
        username: staff.username,
        image: staff.profile_image || null,
    };
}

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

    useEffect(() => {
        const loadStaff = async () => {
            try {
                const data = await api.get('/api/staff');
                setStaffList(Array.isArray(data) ? data.map(mapApiStaffToUi) : []);
            } catch (error) {
                showToast(error.message || 'Unable to load staff list');
            }
        };

        loadStaff();
    }, []);

    // เปิด Modal พร้อมเซ็ตข้อมูล
    const openModal = (type, staff = null) => {
        setModalType(type);
        setSelectedStaff(staff);
        if (staff && (type === 'EDIT' || type === 'VIEW')) {
            setFormData({ ...staff, password: '' });
        } else {
            setFormData({ name: '', title: '', role: 'Field-Ops', area: '', contact: '', status: 'Off Duty', username: '', password: '', image: null });
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
            showToast('Image is still uploading. Please wait.');
            return;
        }

        const requiredFields = [
            formData.username,
            formData.password,
            formData.name,
            formData.contact,
            formData.title,
            formData.role,
            formData.status,
        ];
        if (requiredFields.some((value) => !String(value ?? '').trim())) {
            showToast('Please fill in all required fields (image is optional).', 'error');
            return;
        }

        try {
            setIsSubmitting(true);

            if (modalType === 'ADD') {
                const payload = {
                    username: formData.username.trim(),
                    password: formData.password,
                    full_name: formData.name.trim(),
                    contact_number: formData.contact.trim(),
                    title_role: formData.title.trim(),
                    staff_role: formData.role,
                    status: formData.status,
                    profile_image: formData.image || null,
                };

                const result = await api.post('/api/add_new_staff', payload);
                const created = result?.staff ? mapApiStaffToUi(result.staff) : { ...formData, id: Date.now() };
                setStaffList([created, ...staffList]);
                showToast('Staff member added successfully', 'success');
            } else if (modalType === 'EDIT') {
                const payload = {
                    staff_id: selectedStaff.id,
                    username: formData.username.trim(),
                    password: formData.password,
                    full_name: formData.name.trim(),
                    contact_number: formData.contact.trim(),
                    title_role: formData.title.trim(),
                    staff_role: formData.role,
                    status: formData.status,
                    profile_image: formData.image || null,
                };

                const result = await api.post('/api/edit_staff', payload);
                const updated = result?.staff ? mapApiStaffToUi(result.staff) : { ...formData, id: selectedStaff.id };
                setStaffList(staffList.map((s) => (s.id === selectedStaff.id ? updated : s)));
                showToast('Staff profile updated successfully', 'success');
            }

            closeModal();
        } catch (error) {
            showToast(error.message || 'Unable to save staff data', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // จัดการลบข้อมูล
    const handleDelete = async () => {
        if (!selectedStaff?.id) {
            showToast('Invalid staff selection', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.delete(`/api/delete_staff/${selectedStaff.id}`);
            setStaffList(staffList.filter((s) => s.id !== selectedStaff.id));
            showToast('Staff member deleted successfully', 'success');
            closeModal();
        } catch (error) {
            showToast(error.message || 'Unable to delete staff data', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ฟิลเตอร์ข้อมูลตาม Search
    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.type)) {
            showToast('Unsupported file type. Please upload JPG, PNG, or WEBP.', 'error');
            e.target.value = '';
            return;
        }

        const maxFileSize = 5 * 1024 * 1024;
        if (file.size > maxFileSize) {
            showToast('Image size must be 5MB or less', 'error');
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
            showToast(error.message || 'Unable to upload image', 'error');
        } finally {
            setIsUploadingImage(false);
            e.target.value = '';
        }
    };

    return (
        <>
            {/* Header */}
            <header className="p-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Human Resource Management</h1>
            </header>
            <div className="px-8 pb-8">
                {/* Stats Cards */}
                {/* Search and Add Staff */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff by name, role or area..."
                            className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => openModal('ADD')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all shadow-sm shadow-emerald-600/20">
                            <Plus size={16} /> <span>Add New Staff</span>
                        </button>
                    </div>
                </div>
                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-500">NAME</h3>
                        <div className="w-1/2 flex justify-between text-sm font-semibold text-gray-500">
                            <span className="w-1/3">ROLE</span>
                            <span className="w-1/3">STATUS</span>
                            <span className="w-1/3 text-right">ACTIONS</span>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {filteredStaff.map(staff => (
                            <div key={staff.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center space-x-4 w-1/2">
                                    {
                                        staff.image ? (
                                            <img src={resolveMediaUrl(staff.image)} alt="Profile" className="
                                            w-10 h-10 rounded-full object-cover border-2 border-emerald-500/20"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                {staff.name.charAt(0)}
                                            </div>
                                        )
                                    }

                                    <div>
                                        <p className="text-gray-900 font-medium">{staff.name}</p>
                                        <p className="text-xs text-gray-500">{staff.title} • {staff.area}</p>
                                    </div>
                                </div>
                                <div className="w-1/2 flex items-center justify-between">
                                    <div className="w-1/3 text-sm text-gray-600">{staff.role}</div>
                                    <div className="w-1/3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${staff.status === 'On Duty' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {staff.status}
                                        </span>
                                    </div>
                                    <div className="w-1/3 flex justify-end space-x-2 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal('VIEW', staff)} className="p-2  hover:bg-blue-200 rounded-lg text-black-400 hover:text-blue-700 transition-colors"><Eye size={16} /></button>
                                        <button onClick={() => openModal('EDIT', staff)} className="p-2 hover:bg-amber-50 rounded-lg text-black-400 hover:text-amber-700 transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => openModal('DELETE', staff)} className="p-2 hover:bg-red-50 rounded-lg text-black-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MODAL SYSTEM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {modalType === 'ADD' && 'Add New Staff Member'}
                                    {modalType === 'EDIT' && 'Edit Staff Profile'}
                                    {modalType === 'VIEW' && 'Staff Details'}
                                    {modalType === 'DELETE' && 'Confirm Deletion'}
                                </h2>
                                {modalType !== 'DELETE' && modalType !== 'VIEW' && (
                                    <p className="text-sm text-gray-500 mt-1">Fill in the details to {modalType === 'ADD' ? 'register a new' : 'update the'} employee.</p>
                                )}
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        {/* Modal Body: ADD / EDIT Form */}
                        {(modalType === 'ADD' || modalType === 'EDIT') && (
                            <form onSubmit={handleSubmit}>
                                {/* เพิ่ม overflow-y-auto เพื่อให้ฟอร์มเลื่อนดูได้ถ้าข้อมูลยาวเกินหน้าจอ */}
                                <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">

                                    {/* --- Profile Image Upload --- */}
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:bg-gray-100 hover:border-emerald-400 transition-all cursor-pointer group">
                                            {formData.image ? (
                                                <img src={resolveMediaUrl(formData.image)} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                                    <Camera size={24} className="mb-1" />
                                                    <span className="text-[10px] font-medium">Upload</span>
                                                </div>
                                            )}
                                            {/* Input สำหรับเลือกไฟล์รูปภาพ */}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageChange}
                                                disabled={isUploadingImage}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {isUploadingImage ? 'Uploading image...' : 'Please upload JPG, PNG, or WEBP'}
                                        </p>
                                    </div>

                                    {/* --- Account Credentials --- */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1">Account Info</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                                                <input type="text" required value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. john_doe" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                                                <input type="password" required value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Personal & Employment Info --- */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1">Personal Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. John Doe" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Contact Number</label>
                                                <input type="text" required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="+1 (555) 000-0000" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Rank / Title</label>
                                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. Senior Ranger" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none">
                                                    <option>Field-Ops</option>
                                                    <option>Back-Office</option>

                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50/50">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20">
                                        {isSubmitting ? 'Saving...' : modalType === 'ADD' ? 'Create Staff Profile' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Modal Body: VIEW Details */}
                        {modalType === 'VIEW' && selectedStaff && (
                            <div>
                                <div className="p-6 space-y-4">
                                    {selectedStaff.image ? (
                                        <div className="flex items-center space-x-4 mb-6">
                                            <img src={resolveMediaUrl(selectedStaff.image)} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/20" />

                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h3>
                                                <p className="text-emerald-600">{selectedStaff.title}</p>
                                            </div>
                                        </div>

                                    ) : (
                                        <div className="flex items-center space-x-4 mb-6">
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
                                                {selectedStaff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h3>
                                                <p className="text-emerald-600">{selectedStaff.title}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-y-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div><p className="text-gray-500 text-xs">Role</p><p className="text-gray-900 font-medium mt-1">{selectedStaff.role}</p></div>
                                        <div><p className="text-gray-500 text-xs">Status</p>
                                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${selectedStaff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{selectedStaff.status}</span>
                                        </div>
                                        <div><p className="text-gray-500 text-xs">Contact</p><p className="text-gray-900 font-medium mt-1">{selectedStaff.contact}</p></div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50/50">
                                    <button onClick={closeModal} className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors shadow-sm">Close</button>
                                </div>
                            </div>
                        )}

                        {/* Modal Body: DELETE Confirm */}
                        {modalType === 'DELETE' && selectedStaff && (
                            <div>
                                <div className="p-6">
                                    <p className="text-gray-600">Are you sure you want to remove <strong className="text-gray-900">{selectedStaff.name}</strong> from the system? This action cannot be undone.</p>
                                </div>
                                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50/50">
                                    <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                                    <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-red-600/20">
                                        {isSubmitting ? 'Deleting...' : 'Delete Staff'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification (Success Alert) */}
            {toastState.message && (
                <div className={`fixed bottom-6 right-6 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in-up z-50 ${toastState.type === 'error' ? 'bg-red-600 shadow-red-600/30' : 'bg-emerald-600 shadow-emerald-600/30'}`}>
                    <CheckCircle size={20} className={toastState.type === 'error' ? 'text-red-100' : 'text-emerald-100'} />
                    <div>
                        <p className="text-sm font-bold">{toastState.type === 'error' ? 'Error' : 'Success'}</p>
                        <p className="text-xs">{toastState.message}</p>
                    </div>
                    <button onClick={() => setToastState({ message: '', type: 'success' })} className="ml-4 text-white/80 hover:text-white"><X size={16} /></button>
                </div>
            )}

        </>
    );
}