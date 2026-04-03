import React from "react";
import { Navbar } from "../components/Navbar";

export function Contact() {
  const team = [
    {
      id: 1,
      name: "สมชาย รักป่า",
      role: "หัวหน้าโครงการ",
      email: "somchai.r@forestguard.or.th",
      phone: "081-234-5678",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
      bio: "ผู้เชี่ยวชาญด้านการจัดการทรัพยากรป่าไม้ ประสบการณ์กว่า 15 ปีในการดูแลผืนป่าเขาใหญ่"
    },
    {
      id: 2,
      name: "วรัญญา พรรณไม้",
      role: "นักพฤกษศาสตร์",
      email: "waranya.p@forestguard.or.th",
      phone: "089-876-5432",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
      bio: "ดูแลการรวบรวมข้อมูลพันธุ์พืชและสื่อการสอนในระบบ ให้ข้อมูลที่ถูกต้องและเป็นประโยชน์"
    },
    {
      id: 3,
      name: "ธนาวุฒิ สัตว์ป่า",
      role: "เจ้าหน้าที่ลาดตระเวน",
      email: "thanawut.s@forestguard.or.th",
      phone: "085-555-0123",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      bio: "รับผิดชอบการตรวจสอบรายงานเหตุการณ์และประสานงานหน่วยงานในพื้นที่เมื่อเกิดเหตุฉุกเฉิน"
    },
    {
      id: 4,
      name: "นรากร ไอที",
      role: "นักพัฒนาแอปพลิเคชัน",
      email: "narakorn.i@forestguard.or.th",
      phone: "082-111-2233",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      bio: "ดูแลระบบเทคโนโลยีและการรับแจ้งเหตุ เพื่อให้การสื่อสารระหว่างชุมชนและอุทยานรวดเร็วที่สุด"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-green-900 pb-12 pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            ติดต่อทีมงาน
          </h1>
          <p className="text-green-100 max-w-xl mx-auto text-lg">
            เราพร้อมให้ความช่วยเหลือและรับฟังคำแนะนำ เพื่อการอนุรักษ์ป่าไม้อย่างยั่งยืน
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 lg:px-8 py-16 flex-grow">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">พบกับทีมงานของเรา</h2>
          <div className="h-1.5 w-20 bg-green-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((person) => (
            <div key={person.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500 flex flex-col h-full">
              <div className="h-48 overflow-hidden relative shrink-0">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-6 flex flex-col flex-grow text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{person.name}</h3>
                <span className="text-green-600 font-semibold text-sm mb-4 block uppercase tracking-wider">{person.role}</span>
                <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                  {person.bio}
                </p>
                <div className="mt-auto pt-6 border-t border-gray-50 space-y-2">
                  <a href={`mailto:${person.email}`} className="text-xs text-gray-500 hover:text-green-600 flex items-center justify-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {person.email}
                  </a>
                  <a href={`tel:${person.phone}`} className="text-xs text-gray-500 hover:text-green-600 flex items-center justify-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {person.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-green-50 rounded-3xl p-8 md:p-12 border border-green-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-green-900 mb-4">สำนักงานอุทยานแห่งชาติ</h2>
              <p className="text-green-800 mb-6">ตู้ ปณ.9 ปณ.ปากช่อง อำเภอปากช่อง จังหวัดนครราชสีมา 30130</p>
              <div className="space-y-4 text-green-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <span>เปิดทำการทุกวัน: 06.00 - 18.00 น.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <span>เบอร์ฉุกเฉิน: 1362 (สายด่วนกรมอุทยานฯ)</span>
                </div>
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl overflow-hidden shadow-inner grayscale contrast-125">
              {/* Placeholder for map */}
              <div className="w-full h-full flex items-center justify-center text-gray-500 italic bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                Map View: Khao Yai National Park
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
