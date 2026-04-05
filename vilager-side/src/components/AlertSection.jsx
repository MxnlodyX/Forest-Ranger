import React, { useState } from "react";

export function AlertSection() {
  // 1. เพิ่ม State สำหรับเก็บรายละเอียด "อื่นๆ"
  const [selectedType, setSelectedType] = useState("");
  const [otherDetail, setOtherDetail] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setTimeout(() => {
      setLocationStr("18.8045° N, 98.9190° E (ดอยสุเทพ)");
      setIsGettingLocation(false);
    }, 1000);
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
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">

            {/* Step 1: Select Incident Type */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-white mb-4">
                1. เลือกประเภทเหตุการณ์ <span className="text-red-400">*</span>
              </label>

              {/* ปรับเป็น grid-cols-2 สำหรับมือถือ และ grid-cols-4 สำหรับ Desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setSelectedType("fire")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    selectedType === "fire"
                      ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] scale-105"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                  <span className="font-semibold text-sm">ไฟป่า</span>
                </button>

                <button
                  onClick={() => setSelectedType("flood")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    selectedType === "flood"
                      ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>
                  <span className="font-semibold text-sm text-center">น้ำท่วม/ดินถล่ม</span>
                </button>

                <button
                  onClick={() => setSelectedType("wildlife")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    selectedType === "wildlife"
                      ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>
                  <span className="font-semibold text-sm">สัตว์ป่าบุกรุก</span>
                </button>

                {/* ปุ่ม 기타 (อื่นๆ) */}
                <button
                  onClick={() => setSelectedType("other")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    selectedType === "other"
                      ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-105"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 mb-2"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
                  <span className="font-semibold text-sm">อื่นๆ</span>
                </button>
              </div>

              {/* 2. แสดง Input เพิ่มเติมเมื่อเลือก "อื่นๆ" พร้อม Animation เลื่อนลง */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  selectedType === "other" ? "max-h-24 opacity-100 mt-4" : "max-h-0 opacity-0"
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

            <div className="space-y-6">
              {/* Step 2: Location */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  2. ระบุสถานที่เกิดเหตุ <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative grow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <input
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="ชื่ออุทยาน, ป่าสงวน หรือพิกัด Lat/Long..."
                    />
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-green-700/80 hover:bg-green-600 text-white font-medium border border-green-500/30 transition-all focus:ring-2 focus:ring-green-500"
                    >
                      {isGettingLocation ? (
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      )}
                      {isGettingLocation ? "กำลังค้นหา..." : "ดึงพิกัด GPS"}
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all tooltip-trigger"
                      title="เลือกบนแผนที่"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact & Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">เบอร์โทรติดต่อกลับ</label>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 h-5 w-5 text-gray-400">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="08X-XXX-XXXX" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">แนบรูปถ่าย (ถ้ามี)</label>
                  <input type="file" className="flex h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-700 file:text-white hover:file:bg-green-600 transition-all cursor-pointer" accept="image/*" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">รายละเอียดเพิ่มเติม</label>
                <textarea className="flex min-h-[100px] w-full rounded-lg border border-white/20 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="อธิบายลักษณะเหตุการณ์..." rows="3"></textarea>
              </div>

              {/* Submit Action */}
              <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-white/10">
                <div className="flex items-center gap-3 text-orange-400 bg-orange-400/10 px-4 py-2 rounded-lg w-full sm:w-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <div className="text-left">
                    <span className="block text-xs font-medium text-orange-300">สายด่วนกรมอุทยานฯ</span>
                    <strong className="text-lg leading-none">1362</strong>
                  </div>
                </div>

                <button className="relative w-full sm:w-auto group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 group-hover:translate-x-1 transition-transform"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                  ส่งข้อมูลแจ้งเหตุ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
