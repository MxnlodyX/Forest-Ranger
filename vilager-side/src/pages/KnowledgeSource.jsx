import React, { useState } from "react";
import { Navbar } from "../components/Navbar";

export function KnowledgeSources() {
  // State สำหรับเก็บประเภทสื่อที่กำลังเลือกอยู่
  const [activeMediaType, setActiveMediaType] = useState("ทั้งหมด");
  // State สำหรับเก็บหมวดหมู่ที่กำลังเลือกอยู่
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  // State สำหรับเก็บข้อความค้นหา
  const [searchQuery, setSearchQuery] = useState("");

  // ข้อมูลบทความจำลอง
  const resources = [
    {
      id: 1,
      title: "เส้นทางศึกษาธรรมชาติ: เรียนรู้ป่าดิบชื้นเขตร้อน",
      excerpt: "สำรวจความหลากหลายของสิ่งมีชีวิตตามเส้นทางเดินป่า ตั้งแต่พืชคลุมดินจนถึงเรือนยอดไม้สูง",
      category: "ระบบนิเวศ",
      date: "28 มี.ค. 2569",
      readTime: "8 นาที",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop",
      type: "บทความ"
    },
    {
      id: 2,
      title: "น้ำตกและลำธาร: เส้นเลือดของผืนป่า",
      excerpt: "ความสำคัญของระบบน้ำในป่าต่อความยั่งยืนของระบบนิเวศทั้งหมด",
      category: "แหล่งน้ำ",
      date: "25 มี.ค. 2569",
      readTime: "5 นาที",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop",
      type: "วิดีโอ"
    },
    {
      id: 3,
      title: "นกป่าเขตร้อน: ตัวชี้วัดสุขภาพป่า",
      excerpt: "ทำไมนกจึงเป็นดัชนีชี้วัดที่ดีที่สุดของความสมบูรณ์ของระบบนิเวศป่า",
      category: "สัตว์ป่า",
      date: "20 มี.ค. 2569",
      readTime: "6 นาที",
      image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=800&auto=format&fit=crop",
      type: "บทความ"
    },
    {
      id: 4,
      title: "ไฟป่า: ภัยเงียบที่ทำลายล้างผืนป่าทั่วโลก",
      excerpt: "สาเหตุ ผลกระทบ และวิธีป้องกันไฟป่าที่ทุกคนควรรู้",
      category: "ภัยพิบัติ",
      date: "15 มี.ค. 2569",
      readTime: "10 นาที",
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop",
      type: "บทความ"
    },
    {
      id: 5,
      title: "การปลูกป่าทดแทน: แนวทางฟื้นฟูระบบนิเวศ",
      excerpt: "วิธีการปลูกป่าที่ถูกต้องเพื่อฟื้นฟูพื้นที่ป่าเสื่อมโทรมอย่างยั่งยืน",
      category: "การอนุรักษ์",
      date: "10 มี.ค. 2569",
      readTime: "12 นาที",
      image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=800&auto=format&fit=crop",
      type: "วิดีโอ"
    },
  ];

  // กรองข้อมูลตามเงื่อนไข
  const filteredResources = resources.filter((item) => {
    const matchesMediaType = activeMediaType === "ทั้งหมด" || item.type === activeMediaType;
    const matchesCategory = activeCategory === "ทั้งหมด" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMediaType && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Hero Header */}
      <div className="bg-green-900 pb-12 pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            สื่อการสอน
          </h1>
          <p className="text-green-100 max-w-xl mx-auto text-lg">
            รวมบทความ วิดีโอ และสื่อการสอนเกี่ยวกับป่าไม้ ระบบนิเวศ และการอนุรักษ์ธรรมชาติ
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 lg:px-8 py-10 -mt-10 grow">

        {/* Filters & Search Container */}
        <div className="mb-8 space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              className="flex w-full px-3 py-2 text-sm pl-12 h-12 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="ค้นหาบทความ, วิดีโอ, สื่อการสอน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Media Type Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveMediaType("ทั้งหมด")}
              className={`inline-flex items-center justify-center text-sm font-medium h-9 px-4 rounded-full transition-colors ${
                activeMediaType === "ทั้งหมด"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveMediaType("บทความ")}
              className={`inline-flex items-center justify-center text-sm font-medium h-9 px-4 rounded-full gap-1.5 transition-colors ${
                activeMediaType === "บทความ"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
              </svg>
              บทความ
            </button>
            <button
              onClick={() => setActiveMediaType("วิดีโอ")}
              className={`inline-flex items-center justify-center text-sm font-medium h-9 px-4 rounded-full gap-1.5 transition-colors ${
                activeMediaType === "วิดีโอ"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
                <rect x="2" y="6" width="14" height="12" rx="2"></rect>
              </svg>
              วิดีโอ
            </button>
          </div>

          {/* Category Filters (Tag) */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 border-t border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mt-1.5 mr-1">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {["ทั้งหมด", "ระบบนิเวศ", "แหล่งน้ำ", "สัตว์ป่า", "ภัยพิบัติ", "การอนุรักษ์"].map((cat) => (
              <div
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center rounded-full border font-semibold cursor-pointer transition-colors text-xs px-3 py-1 ${
                  activeCategory === cat
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6 font-medium">
          แสดง {filteredResources.length} จาก {resources.length} รายการ
        </p>

        {/* Content Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((item) => (
              <article key={item.id} className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100">
                <div className="relative h-52 overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      {item.category}
                    </span>
                    {/* Badge แสดงประเภท (บทความ/วิดีโอ) */}
                    <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      {item.type === "วิดีโอ" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path></svg>
                      )}
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col grow">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 grow">
                    {item.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                        {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {item.readTime}
                      </span>
                    </div>
                    <button className="text-green-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                      อ่าน <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-900">ไม่พบสื่อที่คุณค้นหา</h3>
            <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveMediaType("ทั้งหมด");
                setActiveCategory("ทั้งหมด");
              }}
              className="mt-4 text-green-600 font-semibold hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
