
import MockImage from "../assets/blog-forest-trail-BWEN6ox8.jpg";

export function ArticlesSection() {
  // ข้อมูลจำลอง (Mock Data) สำหรับบทความ
  const articleData = [
    {
      id: 1,
      title: "เส้นทางศึกษาธรรมชาติ: เรียนรู้ป่าดิบชื้นเขตร้อน",
      excerpt: "สำรวจความหลากหลายของสิ่งมีชีวิตตามเส้นทางเดินป่า ตั้งแต่พืชคลุมดินจนถึงเรือนยอดไม้สูง",
      category: "ระบบนิเวศ",
      date: "28 มี.ค. 2569",
      readTime: "8 นาที",
      image: MockImage,
      isFeatured: true,
    },
    {
      id: 2,
      title: "น้ำตกและลำธาร: เส้นเลือดของผืนป่า",
      excerpt: "ความสำคัญของระบบน้ำในป่าต่อความยั่งยืนของระบบนิเวศทั้งหมด",
      category: "แหล่งน้ำ",
      date: "25 มี.ค. 2569",
      readTime: "5 นาที",
      image: MockImage,
    },
    {
      id: 3,
      title: "นกป่าเขตร้อน: ตัวชี้วัดสุขภาพป่า",
      excerpt: "ทำไมนกจึงเป็นดัชนีชี้วัดที่ดีที่สุดของความสมบูรณ์ของระบบนิเวศป่า",
      category: "สัตว์ป่า",
      date: "20 มี.ค. 2569",
      readTime: "6 นาที",
      image: MockImage,
    },
    {
      id: 4,
      title: "ไฟป่า: ภัยเงียบที่ทำลายล้างผืนป่าทั่วโลก",
      excerpt: "สาเหตุ ผลกระทบ และวิธีป้องกันไฟป่าที่ทุกคนควรรู้",
      category: "ภัยพิบัติ",
      date: "15 มี.ค. 2569",
      readTime: "10 นาที",
      image: MockImage,
    },
  ];

  return (
    <section id="articles" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-green-600 tracking-widest uppercase">
            บทความล่าสุด
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mt-2">
            เรียนรู้จากผืนป่า
          </h2>
          <p className="text-gray-600 mt-4 max-w-lg mx-auto">
            บทความและสื่อการสอนเกี่ยวกับป่าไม้ ระบบนิเวศ และการอนุรักษ์ธรรมชาติ
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articleData.map((article, index) => {
            // เช็คว่าเป็นบทความแรก (Featured) หรือไม่
            const isFeatured = index === 0;

            if (isFeatured) {
              return (
                <article key={article.id} className="group relative rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-500 col-span-full lg:col-span-2 border border-gray-100">
                  <div className="grid lg:grid-cols-2 gap-0 h-full">
                    <div className="relative h-64 lg:h-full overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <h3 className="font-display text-2xl lg:text-3xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {article.readTime}
                        </span>
                      </div>
                      <button className="inline-flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all w-fit">
                        อ่านต่อ
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            // บทความทั่วไป (Regular Cards)
            return (
              <article key={article.id} className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100">
                <div className="relative h-52 overflow-hidden shrink-0">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col grow">
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 grow">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                        {article.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {article.readTime}
                      </span>
                    </div>
                    <button className="text-green-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                      อ่าน
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
