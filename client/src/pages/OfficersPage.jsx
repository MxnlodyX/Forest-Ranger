import { useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { LoadingSpinner, ErrorAlert, Button } from '../components/ui';

export function OfficersPage() {
  const { data: officers, loading, error, refetch } = useApi(() => api.get('/api/officers'));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    position: '',
    department: '',
    rank: '',
    phone: '',
    email: '',
    hire_date: '',
    status: 'active'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (officer = null) => {
    if (officer) {
      setEditingOfficer(officer);
      setFormData({
        employee_id: officer.employee_id || '',
        first_name: officer.first_name || '',
        last_name: officer.last_name || '',
        position: officer.position || '',
        department: officer.department || '',
        rank: officer.rank || '',
        phone: officer.phone || '',
        email: officer.email || '',
        hire_date: officer.hire_date || '',
        status: officer.status || 'active'
      });
    } else {
      setEditingOfficer(null);
      setFormData({
        employee_id: '',
        first_name: '',
        last_name: '',
        position: '',
        department: '',
        rank: '',
        phone: '',
        email: '',
        hire_date: '',
        status: 'active'
      });
    }
    setIsFormOpen(true);
    setFormError('');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOfficer(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingOfficer) {
        await api.put(`/api/officers/${editingOfficer.id}`, formData);
      } else {
        await api.post('/api/officers', formData);
      }
      await refetch();
      handleCloseForm();
    } catch (err) {
      setFormError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลเจ้าหน้าที่นี้หรือไม่?')) return;

    try {
      await api.delete(`/api/officers/${id}`);
      await refetch();
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };
    const labels = {
      active: 'ปฏิบัติงาน',
      inactive: 'ไม่ได้ปฏิบัติงาน',
      on_leave: 'ลาพักงาน'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              ระบบจัดการข้อมูลเจ้าหน้าที่
            </h1>
            <Button onClick={() => handleOpenForm()}>
              + เพิ่มเจ้าหน้าที่
            </Button>
          </div>

          {loading && <LoadingSpinner message="กำลังโหลดข้อมูล..." />}

          {error && <ErrorAlert message={error} onRetry={refetch} />}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัสพนักงาน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ตำแหน่ง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      แผนก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {officers?.map((officer) => (
                    <tr key={officer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {officer.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {officer.first_name} {officer.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {officer.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {officer.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(officer.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleOpenForm(officer)}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(officer.id)}
                        >
                          ลบ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && officers?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบข้อมูลเจ้าหน้าที่
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingOfficer ? 'แก้ไขข้อมูลเจ้าหน้าที่' : 'เพิ่มเจ้าหน้าที่ใหม่'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสพนักงาน *
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะ *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">ปฏิบัติงาน</option>
                    <option value="inactive">ไม่ได้ปฏิบัติงาน</option>
                    <option value="on_leave">ลาพักงาน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    นามสกุล *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ตำแหน่ง *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แผนก *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระดับ/อันดับ
                  </label>
                  <input
                    type="text"
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มงาน
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseForm}
                  disabled={formLoading}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'กำลังบันทึก...' : editingOfficer ? 'บันทึกการแก้ไข' : 'เพิ่มเจ้าหน้าที่'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
