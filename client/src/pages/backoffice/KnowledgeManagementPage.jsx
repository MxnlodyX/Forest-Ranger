import React, { useCallback, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, Plus, Search, X, FileText, Video, PlayCircle } from 'lucide-react';
import { resolveMediaUrl } from '../../services/api';
import { Editor } from '../../components/ui/Editor';

// Mock Data Converter Helper
const stringToEditorData = (str) => ({
  time: Date.now(),
  blocks: [
    {
      type: 'paragraph',
      data: { text: str }
    }
  ],
  version: '2.31.5'
});

// Mock Data
const initialKnowledgeResources = [
  {
    id: 1,
    title: "เส้นทางศึกษาธรรมชาติ: เรียนรู้ป่าดิบชื้นเขตร้อน",
    excerpt: "สำรวจความหลากหลายของสิ่งมีชีวิตตามเส้นทางเดินป่า ตั้งแต่พืชคลุมดินจนถึงเรือนยอดไม้สูง",
    category: "ระบบนิเวศ",
    date: "28 มี.ค. 2569",
    readTime: "8 นาที",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop",
    type: "บทความ",
    content: stringToEditorData("บทความนี้จะพาคุณไปสำรวจความมหัศจรรย์ของป่าดิบชื้นเขตร้อน...")
  },
  {
    id: 2,
    title: "น้ำตกและลำธาร: เส้นเลือดของผืนป่า",
    excerpt: "ความสำคัญของระบบน้ำในป่าต่อความยั่งยืนของระบบนิเวศทั้งหมด",
    category: "แหล่งน้ำ",
    date: "25 มี.ค. 2569",
    readTime: "5 นาที",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop",
    type: "วิดีโอ",
    content: stringToEditorData("วิดีโอนี้แสดงให้เห็นถึงความเชื่อมโยงระหว่างต้นน้ำและปลายน้ำ...")
  },
  {
    id: 3,
    title: "นกป่าเขตร้อน: ตัวชี้วัดสุขภาพป่า",
    excerpt: "ทำไมนกจึงเป็นดัชนีชี้วัดที่ดีที่สุดของความสมบูรณ์ของระบบนิเวศป่า",
    category: "สัตว์ป่า",
    date: "20 มี.ค. 2569",
    readTime: "6 นาที",
    image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=800&auto=format&fit=crop",
    type: "บทความ",
    content: stringToEditorData("การสำรวจประชากรนกสามารถบอกเราได้ถึงความเปลี่ยนแปลงของสภาพแวดล้อม...")
  },
  {
    id: 4,
    title: "ไฟป่า: ภัยเงียบที่ทำลายล้างผืนป่าทั่วโลก",
    excerpt: "สาเหตุ ผลกระทบ และวิธีป้องกันไฟป่าที่ทุกคนควรรู้",
    category: "ภัยพิบัติ",
    date: "15 มี.ค. 2569",
    readTime: "10 นาที",
    image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop",
    type: "บทความ",
    content: stringToEditorData("ทำความเข้าใจสาเหตุของไฟป่า ทั้งที่เกิดจากธรรมชาติและน้ำมือมนุษย์...")
  },
  {
    id: 5,
    title: "การปลูกป่าทดแทน: แนวทางฟื้นฟูระบบนิเวศ",
    excerpt: "วิธีการปลูกป่าที่ถูกต้องเพื่อฟื้นฟูพื้นที่ป่าเสื่อมโทรมอย่างยั่งยืน",
    category: "การอนุรักษ์",
    date: "10 มี.ค. 2569",
    readTime: "12 นาที",
    image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=800&auto=format&fit=crop",
    type: "วิดีโอ",
    content: stringToEditorData("เทคนิคการเลือกพันธุ์ไม้และการดูแลหลังการปลูก...")
  },
];

const mediaTypes = ["บทความ", "วิดีโอ"];
const categories = ["ระบบนิเวศ", "แหล่งน้ำ", "สัตว์ป่า", "ภัยพิบัติ", "การอนุรักษ์"];

// Helper to extract YouTube ID
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}` 
    : url;
};

// EditorJS Content Renderer Component
const EditorContentRenderer = ({ content }) => {
  if (!content || !content.blocks) return null;
  
  return (
    <div className="prose prose-sm max-w-none text-gray-700 leading-loose">
      {content.blocks.map((block, index) => {
        switch (block.type) {
          case 'header':
            const Tag = `h${block.data.level}`;
            return <Tag key={index} className="font-bold text-gray-900 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
          
          case 'paragraph':
            return <p key={index} className="mb-3" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
          
          case 'list':
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={block.data.style === 'ordered' ? 'list-decimal pl-5 mb-3' : 'list-disc pl-5 mb-3'}>
                {block.data.items.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ListTag>
            );

          case 'checklist':
            return (
              <div key={index} className="mb-3">
                {block.data.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" checked={item.checked} readOnly className="rounded border-gray-300 text-green-600" />
                    <span dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                ))}
              </div>
            );

          case 'quote':
            return (
              <blockquote key={index} className="border-l-4 border-green-500 pl-4 italic my-4 bg-gray-50 py-2">
                <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                {block.data.caption && <cite className="text-xs text-gray-500 block mt-1">— {block.data.caption}</cite>}
              </blockquote>
            );

          case 'table':
            return (
              <div key={index} className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-200">
                  <tbody>
                    {block.data.content.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="border border-gray-200 px-3 py-2" dangerouslySetInnerHTML={{ __html: cell }} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'code':
            return (
              <pre key={index} className="bg-gray-900 text-green-400 p-4 rounded-lg my-4 overflow-x-auto text-xs">
                <code>{block.data.code}</code>
              </pre>
            );

          default:
            console.warn('Unknown block type:', block.type);
            return null;
        }
      })}
    </div>
  );
};

export function KnowledgeManagementPage() {
  const [resources, setResources] = useState(initialKnowledgeResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'view' | 'delete'
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'บทความ',
    category: 'ระบบนิเวศ',
    excerpt: '',
    content: { blocks: [] },
    readTime: '',
    image: '',
    videoUrl: '',
    imageFile: null,
    imagePreview: '',
  });

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(res =>
      res.title.toLowerCase().includes(q) ||
      res.category.toLowerCase().includes(q) ||
      res.excerpt.toLowerCase().includes(q) ||
      res.type.toLowerCase().includes(q)
    );
  }, [resources, searchQuery]);

  const selectedResource = useMemo(
    () => resources.find(r => r.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  const resetForm = useCallback((data = null) => {
    if (data) {
      setFormData({
        ...data,
        videoUrl: data.videoUrl || '',
        imageFile: null,
        imagePreview: data.image || '',
      });
    } else {
      setFormData({
        title: '',
        type: 'บทความ',
        category: 'ระบบนิเวศ',
        excerpt: '',
        content: { blocks: [] },
        readTime: '',
        image: '',
        videoUrl: '',
        imageFile: null,
        imagePreview: '',
      });
    }
  }, []);

  const openModal = (mode, resource = null) => {
    setModalMode(mode);
    setActionError('');
    if (resource) {
      setSelectedResourceId(resource.id);
      resetForm({
        title: resource.title,
        type: resource.type,
        category: resource.category,
        excerpt: resource.excerpt,
        content: resource.content || { blocks: [] },
        readTime: resource.readTime,
        image: resource.image,
        videoUrl: resource.videoUrl || '',
      });
    } else {
      setSelectedResourceId(null);
      resetForm();
    }
  };

  const closeModal = () => {
    if (formData.imagePreview && formData.imageFile) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setModalMode(null);
    setSelectedResourceId(null);
    resetForm();
    setActionError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.imagePreview && formData.imageFile) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.image;
      if (formData.imageFile) {
        finalImageUrl = formData.imagePreview; 
      }

      const payload = {
        title: formData.title,
        type: formData.type,
        category: formData.category,
        excerpt: formData.excerpt,
        content: formData.content,
        readTime: formData.readTime,
        image: finalImageUrl,
        videoUrl: formData.type === 'วิดีโอ' ? formData.videoUrl : '',
      };

      if (modalMode === 'add') {
        const newResource = {
          ...payload,
          id: Date.now(),
          date: new Date().toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        };
        setResources(prev => [newResource, ...prev]);
      } else if (modalMode === 'edit' && selectedResourceId) {
        setResources(prev => prev.map(r =>
          r.id === selectedResourceId ? { ...r, ...payload } : r
        ));
      }
      closeModal();
    } catch (err) {
      setActionError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    try {
      setResources(prev => prev.filter(r => r.id !== selectedResourceId));
      closeModal();
    } catch (err) {
      setActionError('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="p-6 md:p-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการบทความ วิดีโอ และสื่อการสอนสำหรับชุมชน (Powered by EditorJS)
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="ค้นหาตามชื่อ, หมวดหมู่, ประเภท..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-green-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <button
            onClick={() => openModal('add')}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <Plus size={18} />
            สร้างสื่อใหม่
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">ชื่อสื่อ</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold">คำโปรย</th>
                <th className="px-4 py-3 font-semibold">เวลาอ่าน/ชม</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => (
                  <tr key={res.id} className="transition-colors hover:bg-gray-50">
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0">
                          <img
                            src={resolveMediaUrl(res.image || 'https://placehold.co/400x400?text=No+Image')}
                            alt=""
                            className="h-full w-full rounded object-cover border border-gray-100"
                          />
                          {res.type === 'วิดีโอ' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                              <PlayCircle size={14} className="text-white fill-white/20" />
                            </div>
                          )}
                        </div>
                        <span className="truncate">{res.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        res.type === 'บทความ' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {res.type === 'บทความ' ? <FileText size={12} /> : <Video size={12} />}
                        {res.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{res.category}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">{res.excerpt}</td>
                    <td className="px-4 py-3 text-gray-500">{res.readTime}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{res.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('view', res)}
                          className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openModal('edit', res)}
                          className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50"
                          title="แก้ไข"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => openModal('delete', res)}
                          className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" onClick={closeModal}>
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'add' ? 'สร้างสื่อใหม่' :
                 modalMode === 'edit' ? 'แก้ไขสื่อ' :
                 modalMode === 'view' ? 'รายละเอียดสื่อ' : 'ยืนยันการลบ'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {(modalMode === 'add' || modalMode === 'edit') && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">ชื่อสื่อ</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                      placeholder={formData.type === 'วิดีโอ' ? 'เช่น วิดีโอสอนการป้องกันไฟป่า' : 'เช่น วิธีการแยกประเภทพันธุ์ไม้'}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">ประเภท</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                    >
                      {mediaTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">หมวดหมู่</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {formData.type === 'วิดีโอ' ? 'ความยาววิดีโอ (เช่น 10:30 นาที)' : 'เวลาอ่านโดยประมาณ (เช่น 5 นาที)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.readTime}
                      onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                      placeholder={formData.type === 'วิดีโอ' ? 'เช่น 12:45 นาที' : 'เช่น 8 นาที'}
                    />
                  </div>

                  {formData.type === 'วิดีโอ' ? (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">YouTube / Video URL</label>
                      <input
                        type="text"
                        required
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">รูปภาพหน้าปก (Upload)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {formData.imagePreview && (
                        <div className="mt-2 relative h-20 w-32 overflow-hidden rounded border border-gray-200">
                          <img src={formData.imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">คำโปรย (Excerpt)</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                      placeholder="สรุปเนื้อหาสั้นๆ เพื่อดึงดูดผู้อ่าน/ผู้ชม"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {formData.type === 'วิดีโอ' ? 'รายละเอียดวิดีโอ' : 'เนื้อหาบทความ'}
                    </label>
                    <Editor 
                      key={selectedResourceId || 'new'}
                      data={formData.content}
                      onChange={(data) => setFormData({ ...formData, content: data })}
                      placeholder={formData.type === 'วิดีโอ' ? 'ระบุรายละเอียดเพิ่มเติม' : 'พิมพ์เนื้อหาบทความที่นี่...'}
                    />
                  </div>
                </div>
              )}

              {modalMode === 'view' && selectedResource && (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg shadow-sm bg-black">
                    {selectedResource.type === 'วิดีโอ' && selectedResource.videoUrl ? (
                      <div className="aspect-video w-full">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedResource.videoUrl)}
                          className="h-full w-full"
                          allowFullScreen
                          title="Video preview"
                        ></iframe>
                      </div>
                    ) : (
                      <img
                        src={resolveMediaUrl(selectedResource.image || 'https://placehold.co/800x400?text=No+Cover')}
                        alt=""
                        className="h-64 w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">ประเภท</p>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-900 font-semibold">
                        {selectedResource.type === 'บทความ' ? <FileText size={16} className="text-blue-500" /> : <Video size={16} className="text-purple-500" />}
                        {selectedResource.type}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">หมวดหมู่</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedResource.category}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        {selectedResource.type === 'วิดีโอ' ? 'ความยาว' : 'เวลาอ่าน'}
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedResource.readTime}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-[10px] uppercase font-bold text-gray-400">วันที่สร้าง</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedResource.date}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedResource.title}</h3>
                    {selectedResource.videoUrl && selectedResource.type === 'วิดีโอ' && (
                      <a href={selectedResource.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                        Original Link: {selectedResource.videoUrl}
                      </a>
                    )}
                    <div className="mt-3 flex items-start gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                      <span className="text-green-600 font-bold text-lg leading-none">“</span>
                      <p className="text-sm text-green-800 italic leading-relaxed">{selectedResource.excerpt}</p>
                      <span className="text-green-600 font-bold text-lg leading-none self-end">”</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs font-bold uppercase tracking-widest">
                      <div className="h-px flex-1 bg-gray-100"></div>
                      <span>{selectedResource.type === 'วิดีโอ' ? 'รายละเอียดเพิ่มเติม' : 'เนื้อหา'}</span>
                      <div className="h-px flex-1 bg-gray-100"></div>
                    </div>
                    <EditorContentRenderer content={selectedResource.content} />
                  </div>
                </div>
              )}

              {modalMode === 'delete' && selectedResource && (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <Trash2 size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ยืนยันการลบข้อมูล</h3>
                  <p className="mt-2 text-gray-500 px-6">
                    คุณกำลังจะลบสื่อเรื่อง <span className="font-bold text-gray-900">"{selectedResource.title}"</span> ออกจากระบบ
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-50 text-rose-700 text-xs font-bold">
                    <X size={14} />
                    ไม่สามารถกู้คืนได้ภายหลัง
                  </div>
                </div>
              )}

              {actionError && (
                <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                {modalMode === 'view' ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
              </button>

              {(modalMode === 'add' || modalMode === 'edit') && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : modalMode === 'add' ? 'บันทึกสื่อใหม่' : 'บันทึกการแก้ไข'}
                </button>
              )}

              {modalMode === 'delete' && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังลบ...' : 'ลบทันที'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
