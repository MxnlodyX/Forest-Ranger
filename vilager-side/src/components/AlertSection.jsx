import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const INCIDENT_TYPES = [
  { id: "fire", label: "ไฟป่า", icon: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path> },
  { id: "flood", label: "น้ำท่วม / พายุ", icon: <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></> },
  { id: "wildlife", label: "สัตว์ป่ารบกวน", icon: <><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="20" cy="16" r="2"></circle><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.55 3.55 0 0 1 2 13.5V11a.5.5 0 0 1 .5-.5Q5 10.5 9 10z"></path></> },
  { id: "poaching", label: "ลักลอบล่าสัตว์", icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> },
  { id: "logging", label: "ลักลอบตัดไม้", icon: <path d="M12 22v-5M9 8l3-3 3 3M12 5v13"></path> },
  { id: "damage", label: "ความเสียหายพื้นฐาน", icon: <path d="M3 21h18M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"></path> },
  { id: "emergency", label: "เหตุฉุกเฉิน", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path> },
  { id: "other", label: "อื่นๆ", icon: <><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></> }
];

export function AlertSection() {
  // Step Control
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form States
  const [selectedType, setSelectedType] = useState("");
  const [otherDetail, setOtherDetail] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [urgency, setUrgency] = useState(""); 
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const response = await fetch(`${API_BASE}/api/public/locations`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setLocations(data);
          }
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setTimeout(() => {
      if (locations.length > 0) {
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        setSelectedLocationId(randomLoc.location_id.toString());
      }
      setIsGettingLocation(false);
    }, 1200);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("คุณสามารถแนบรูปภาพได้สูงสุด 5 รูป");
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const nextStep = () => {
    if (step === 1 && (!selectedType || !urgency)) {
      alert("โปรดเลือกประเภทเหตุการณ์และระดับความเร่งด่วน");
      return;
    }
    if (step === 2 && !selectedLocationId) {
      alert("โปรดเลือกสถานที่เกิดเหตุ");
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`${API_BASE}/api/public/alerts/upload`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.image_url);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    return uploadedUrls;
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType("");
    setOtherDetail("");
    setSelectedLocationId("");
    setUrgency("");
    setContactInfo({ fullName: "", phone: "", email: "" });
    setDescription("");
    previews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactInfo.phone) {
      alert("โปรดระบุเบอร์โทรศัพท์สำหรับติดต่อกลับ");
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = await uploadImages();
      const payload = {
        incident_type: selectedType,
        other_detail: selectedType === 'other' ? otherDetail : '',
        urgency,
        location_id: parseInt(selectedLocationId),
        reporter_name: contactInfo.fullName,
        reporter_phone: contactInfo.phone,
        reporter_email: contactInfo.email,
        description,
        image_urls: imageUrls
      };
      const response = await fetch(`${API_BASE}/api/public/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        resetForm();
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 8000);
      } else {
        const errorData = await response.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <section className="py-32 bg-slate-50 flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-sm px-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">ส่งรายงานสำเร็จ</h2>
          <p className="text-slate-500">
            ขอบคุณสำหรับการแจ้งเหตุ ทีมงานของเราจะดำเนินการตรวจสอบสถานการณ์โดยเร็วที่สุด
          </p>
          <button 
            onClick={() => setSubmitSuccess(false)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md"
          >
            รายงานเหตุการณ์ใหม่
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="alert" className="py-24 bg-slate-50 relative overflow-hidden min-h-screen flex items-center font-sans">
      {/* Background Decor - Subtle Light version */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-100 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-50 blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">รายงานเหตุการณ์สาธารณะ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            รายงาน <span className="text-red-600">เหตุการณ์</span> ในพื้นที่ป่า
          </h2>
          <p className="mt-4 text-slate-500 max-w-md mx-auto font-medium">
            ร่วมปกป้องผืนป่าและชุมชนของเราด้วยการรายงานเหตุการณ์ที่เกิดขึ้น
          </p>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto">
          {/* Minimal Progress Indicator */}
          <div className="flex items-center gap-4 mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`h-1.5 grow rounded-full transition-all duration-500 ${
                  step >= s ? "bg-slate-900" : "bg-slate-200"
                }`}></div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50">
            
            {/* Step 1: Types */}
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    01. ประเภทเหตุการณ์
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {INCIDENT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all duration-300 group ${selectedType === t.id
                          ? `border-slate-900 bg-slate-900 text-white shadow-xl scale-102`
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white"
                          }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 transition-transform group-hover:scale-110">
                          {t.icon}
                        </svg>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-center">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedType === "other" && (
                    <input
                      type="text"
                      value={otherDetail}
                      onChange={(e) => setOtherDetail(e.target.value)}
                      className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                      placeholder="โปรดระบุรายละเอียดเหตุการณ์..."
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    02. ระดับความเร่งด่วน
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: "normal", label: "ปกติ", color: "bg-green-100", dot: "bg-green-500", active: "border-green-500 bg-green-50 text-green-700" },
                      { id: "urgent", label: "ด่วน", color: "bg-orange-100", dot: "bg-orange-500", active: "border-orange-500 bg-orange-50 text-orange-700" },
                      { id: "emergency", label: "ด่วนที่สุด", color: "bg-red-100", dot: "bg-red-500", active: "border-red-500 bg-red-50 text-red-700" }
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUrgency(u.id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all duration-300 ${urgency === u.id
                          ? u.active
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${u.dot} ${u.id === 'emergency' && urgency === u.id ? 'animate-ping' : ''}`}></div>
                        <span className="font-bold text-xs uppercase tracking-widest">{u.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    03. สถานที่เกิดเหตุ
                  </h3>
                  
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="w-full h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-3 hover:bg-slate-800 transition-all font-bold group mb-6 shadow-lg shadow-slate-200"
                  >
                    {isGettingLocation ? (
                      <span className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-[-2px] transition-transform">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    )}
                    {isGettingLocation ? "กำลังระบุตำแหน่ง..." : "ระบุตำแหน่งอัตโนมัติ"}
                  </button>

                  <div className="relative group">
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 text-slate-900 appearance-none focus:outline-none focus:border-slate-900 transition-all cursor-pointer font-bold"
                    >
                      <option value="">เลือกสถานที่จากรายการ...</option>
                      {locations.map((loc) => (
                        <option key={loc.location_id} value={loc.location_id}>
                          {loc.location_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    เลือกสถานที่ที่ใกล้ที่สุดหรือใช้การระบุตำแหน่งอัตโนมัติเพื่อการช่วยเหลือที่รวดเร็วขึ้น
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Info */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    04. ข้อมูลผู้แจ้งเหตุ
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="fullName"
                        value={contactInfo.fullName}
                        onChange={handleContactChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                        placeholder="ชื่อ-นามสกุล"
                      />
                      <input
                        name="phone"
                        value={contactInfo.phone}
                        onChange={handleContactChange}
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                        placeholder="เบอร์โทรศัพท์ *"
                      />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={handleContactChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                      placeholder="อีเมล (ไม่บังคับ)"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    05. รูปภาพและรายละเอียดเพิ่มเติม
                  </h3>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
                    {previews.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-slate-900 hover:text-slate-900 transition-all bg-slate-50 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M12 5v14M5 12h14"/></svg>
                        <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">เพิ่มรูปภาพ</span>
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-slate-900 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                    placeholder="อธิบายเหตุการณ์หรือระบุจุดสังเกต..."
                  ></textarea>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 h-14 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  ย้อนกลับ
                </button>
              )}
              
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="grow h-14 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  ถัดไป
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="grow h-14 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    "ส่งรายงาน"
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Quick Help Footer */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 px-4 opacity-80">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-red-600 shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <div>
                   <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">สายด่วนเหตุฉุกเฉิน</p>
                   <p className="text-slate-900 text-3xl font-black tabular-nums">1362</p>
                </div>
             </div>
             
             <div className="text-center md:text-right">
                <p className="text-slate-400 text-[10px] font-medium leading-relaxed max-w-[200px]">
                  รายงานจะถูกส่งตรงไปยังหน่วยพิทักษ์ป่าที่ใกล้ที่สุดเพื่อดำเนินการตรวจสอบทันที
                </p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
