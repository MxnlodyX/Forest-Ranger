import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function AlertSection() {
  // States สำหรับเหตุการณ์และสถานที่
  const [selectedType, setSelectedType] = useState("");
  const [otherDetail, setOtherDetail] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  // States ใหม่ที่เพิ่มเข้ามา
  const [urgency, setUrgency] = useState(""); // normal, urgent, emergency
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        console.log("Fetching locations from:", `${API_BASE}/api/public/locations`);

        const response = await fetch(`${API_BASE}/api/public/locations`);
        if (response.ok) {
          const data = await response.json();
          console.log("Locations data received:", data);

          if (Array.isArray(data)) {
            setLocations(data);
          } else {
            console.error("Received data is not an array:", data);
            throw new Error("Data format error");
          }
        } else {
          console.error("Failed to fetch locations, status:", response.status);
          throw new Error(`HTTP error ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        // Fallback data

      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    // Mocking geolocation find
    setTimeout(() => {
      // In a real app, we'd find the closest location from the list or send coordinates
      if (locations.length > 0) {
        setSelectedLocationId(locations[2]?.location_id.toString() || locations[0].location_id.toString());
      }
      setIsGettingLocation(false);
    }, 1000);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedType) {
      alert("กรุณาเลือกประเภทเหตุการณ์");
      return;
    }
    if (!selectedLocationId) {
      alert("กรุณาเลือกสถานที่เกิดเหตุ");
      return;
    }
    if (!urgency) {
      alert("กรุณาเลือกระดับความเร่งด่วน");
      return;
    }
    if (!contactInfo.phone) {
      alert("กรุณาระบุเบอร์โทรติดต่อกลับ");
      return;
    }

    const payload = {
      incident_type: selectedType,
      other_detail: selectedType === 'other' ? otherDetail : '',
      urgency,
      location_id: parseInt(selectedLocationId),
      reporter_name: contactInfo.fullName,
      reporter_phone: contactInfo.phone,
      reporter_email: contactInfo.email,
      description,
    };

    console.log("Submitting alert to:", `${API_BASE}/api/public/alerts`, payload);
    
    try {
      const response = await fetch(`${API_BASE}/api/public/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Alert submitted successfully:", result);
        alert("ส่งข้อมูลแจ้งเหตุเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบโดยเร็วที่สุด");
        
        // Reset form
        setSelectedType("");
        setOtherDetail("");
        setSelectedLocationId("");
        setUrgency("");
        setContactInfo({
          fullName: "",
          phone: "",
          email: "",
        });
        setDescription("");
      } else {
        const errorData = await response.json();
        console.error("Failed to submit alert:", errorData);
        alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${errorData.error || 'โปรดลองอีกครั้งในภายหลัง'}`);
      }
    } catch (error) {
      console.error("Error submitting alert:", error);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ");
    }
  };

  return (
    <section id="alert" className="py-20 bg-green-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-green-500 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-600 blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-400">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>
            </svg>
            <span className="text-sm font-semibold text-red-400">ระบบแจ้งภัยฉุกเฉิน</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-2">
            แจ้งเหตุภัยพิบัติป่า
          </h2>
          <p className="text-green-100/70 mt-4 max-w-lg mx-auto">
            พบเห็นภัยพิบัติหรือการบุกรุกป่า? แจ้งเหตุได้ทันที ข้อมูลของคุณจะส่งตรงถึงเจ้าหน้าที่พิทักษ์ป่า
          </p>
        </div>

        {/* Main Form Container */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">

            {/* Step 1: Select Incident Type */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm">1</span>
                เลือกประเภทเหตุการณ์ <span className="text-red-400">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedType("fire")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${selectedType === "fire"
                    ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                  <span className="font-medium text-sm">ไฟป่า</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType("flood")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${selectedType === "flood"
                    ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>
                  <span className="font-medium text-sm text-center">น้ำท่วม/ดินถล่ม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType("wildlife")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${selectedType === "wildlife"
                    ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2">
                    <circle cx="11" cy="4" r="2"></circle>
                    <circle cx="18" cy="8" r="2"></circle>
                    <circle cx="20" cy="16" r="2"></circle>
                    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.55 3.55 0 0 1 2 13.5V11a.5.5 0 0 1 .5-.5Q5 10.5 9 10z"></path>
                  </svg>
                  <span className="font-medium text-sm">สัตว์ป่าบุกรุก</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType("other")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${selectedType === "other"
                    ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
                  <span className="font-medium text-sm">อื่นๆ</span>
                </button>
              </div>

              {/* Input เพิ่มเติมเมื่อเลือก "อื่นๆ" */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedType === "other" ? "max-h-24 opacity-100 mt-4" : "max-h-0 opacity-0"
                  }`}
              >
                <input
                  type="text"
                  value={otherDetail}
                  onChange={(e) => setOtherDetail(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-purple-500/50 bg-purple-950/20 px-4 py-2 text-white placeholder:text-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="โปรดระบุ (เช่น ลักลอบตัดไม้, พบผู้ต้องสงสัย...)"
                />
              </div>
            </div>

            <div className="h-px w-full bg-white/10"></div>

            {/* Step 2: Urgency Level */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm">2</span>
                ระดับความเร่งด่วน <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency("normal")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200 ${urgency === "normal"
                    ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${urgency === "normal" ? "bg-green-400" : "bg-gray-500"}`}></div>
                  <span className="font-medium text-sm">ปกติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("urgent")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200 ${urgency === "urgent"
                    ? "bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${urgency === "urgent" ? "bg-orange-400" : "bg-gray-500"}`}></div>
                  <span className="font-medium text-sm">ด่วน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency("emergency")}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-200 ${urgency === "emergency"
                    ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${urgency === "emergency" ? "bg-red-400" : "bg-gray-500"}`}></div>
                  <span className="font-medium text-sm">ฉุกเฉิน</span>
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-white/10"></div>

            {/* Step 3: Location Dropdown */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm">3</span>
                สถานที่เกิดเหตุ <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative grow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    disabled={isLoadingLocations}
                    className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-green-950">เลือกสถานที่...</option>
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id} className="bg-green-950">
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-green-600/90 hover:bg-green-500 text-white font-medium border border-green-500/30 transition-all focus:ring-2 focus:ring-green-500"
                  >
                    {isGettingLocation ? (
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    )}
                    {isGettingLocation ? "กำลังค้นหา..." : "ระบุตำแหน่งอัตโนมัติ"}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-white/10"></div>

            {/* Step 4: Reporter Info & Additional Details */}
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-sm">4</span>
                  ข้อมูลผู้แจ้ง (สำหรับอัปเดตผล)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      name="fullName"
                      value={contactInfo.fullName}
                      onChange={handleContactChange}
                      className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>

                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input
                      name="phone"
                      value={contactInfo.phone}
                      onChange={handleContactChange}
                      required
                      className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="เบอร์โทรติดต่อกลับ *"
                    />
                  </div>

                  <div className="relative md:col-span-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    <input
                      name="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={handleContactChange}
                      className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="อีเมล (เพื่อรับการแจ้งเตือนความคืบหน้า)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white mb-2 text-gray-300">แนบรูปถ่าย หรือวิดีโอ (ถ้ามี)</label>
                  <input type="file" className="flex w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-gray-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500 transition-all cursor-pointer" accept="image/*,video/*" multiple />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white mb-2 text-gray-300">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-lg border border-white/20 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="อธิบายลักษณะเหตุการณ์ จำนวนคน หรือจุดสังเกต..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/10 mt-4">
              <div className="flex items-center gap-3 text-orange-400 bg-orange-400/10 border border-orange-400/20 px-5 py-3 rounded-xl w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <div className="text-left">
                  <span className="block text-xs font-medium text-orange-300">สายด่วนกรมอุทยานฯ</span>
                  <strong className="text-xl leading-none">1362</strong>
                </div>
              </div>

              <button
                type="submit"
                className="relative w-full sm:w-auto group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 group-hover:translate-x-1 transition-transform"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                ส่งข้อมูลแจ้งเหตุ
              </button>
            </div>

          </form>
        </div>
      </div>
    </section>
  );
}