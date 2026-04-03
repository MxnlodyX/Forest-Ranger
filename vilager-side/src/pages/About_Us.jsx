import React from "react";
import { Navbar } from "../components/Navbar";

export function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-green-900 pb-12 pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            อุทยานแห่งชาติเขาใหญ่
          </h1>
          <p className="text-green-100 max-w-xl mx-auto text-lg italic">
            "มรดกโลกทางธรรมชาติและความหลากหลายทางชีวภาพของไทย"
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 lg:px-8 py-10 grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1543326168-1246f4812328?q=80&w=1000&auto=format&fit=crop"
              alt="Khao Yai National Park"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 to-transparent"></div>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-green-800">ทำความรู้จักเขาใหญ่</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              อุทยานแห่งชาติเขาใหญ่เป็นอุทยานแห่งชาติแห่งแรกของประเทศไทย และได้รับการยกย่องให้เป็นมรดกโลกทางธรรมชาติโดยองค์การยูเนสโก (UNESCO)
              ครอบคลุมพื้นที่กว่า 2,168 ตารางกิโลเมตร ใน 4 จังหวัด ได้แก่ นครราชสีมา สระบุรี ปราจีนบุรี และนครนายก
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              พื้นที่นี้เปรียบเสมือน "ปอด" ของภาคกลางและภาคตะวันออกเฉียงเหนือ เป็นต้นน้ำของแม่น้ำสำคัญหลายสาย และเป็นบ้านของสัตว์ป่านานาชนิด
              ตั้งแต่ช้างป่า กวาง เก้ง ไปจนถึงนกเงือกที่หาดูได้ยาก
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex-1 min-w-[150px]">
                <span className="block text-2xl font-bold text-green-600">2,000+</span>
                <span className="text-sm text-gray-500 font-medium">ชนิดพันธุ์พืช</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex-1 min-w-[150px]">
                <span className="block text-2xl font-bold text-green-600">300+</span>
                <span className="text-sm text-gray-500 font-medium">ชนิดพันธุ์นก</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex-1 min-w-[150px]">
                <span className="block text-2xl font-bold text-green-600">70+</span>
                <span className="text-sm text-gray-500 font-medium">ชนิดสัตว์เลี้ยงลูกด้วยนม</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">ความสำคัญเชิงระบบนิเวศ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z"/></svg>
              </div>
              <h3 className="font-bold text-gray-900">ต้นน้ำลำธาร</h3>
              <p className="text-gray-600">เป็นแหล่งต้นน้ำที่หล่อเลี้ยงชีวิตในหลายพื้นที่ ผ่านแม่น้ำมูล แม่น้ำชี และแม่น้ำนครนายก</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg>
              </div>
              <h3 className="font-bold text-gray-900">พื้นที่ป่าไม้</h3>
              <p className="text-gray-600">ประกอบด้วยป่าดิบชื้น ป่าดิบแล้ง ป่าเต็งรัง และทุ่งหญ้าสะวันนา ซึ่งมีความหลากหลายสูง</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="font-bold text-gray-900">ศูนย์กลางอนุรักษ์</h3>
              <p className="text-gray-600">เป็นพื้นที่สำคัญในการวิจัยและปกป้องสัตว์ป่าที่ใกล้สูญพันธุ์ของภูมิภาค</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
