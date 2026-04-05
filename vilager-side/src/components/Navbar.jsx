import { useState } from "react";
export function Navbar() {
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 const NavbarList = {
   "หน้าหลัก": "/",
   "สื่อความรู้": "/knowledge",
   "เกี่ยวกับเรา": "/about",
   "ติดต่อเรา": "/contact",
   "แจ้งเหตุ": "#alert",
 };
	return (
	 <nav className="bg-green-900/95 backdrop-blur-sm fixed w-full z-20 top-0 start-0 border-b border-green-700 shadow-md">
      <div className="max-w-screen-2xl flex flex-wrap items-center justify-between mx-auto p-4">

        {/* Logo Section */}
        <a href="#" className="flex items-center space-x-2 group">
          <svg className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-2xl text-white font-bold tracking-wide">
            Forest Guards
          </span>
        </a>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-green-100 rounded-lg md:hidden hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Navigation Links */}
        <div className={`${isMobileMenuOpen ? "block" : "hidden"} w-full md:block md:w-auto mt-4 md:mt-0 transition-all duration-300 ease-in-out`}>
          <ul className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0 p-4 md:p-0 bg-green-800 md:bg-transparent rounded-lg border border-green-700 md:border-0">
            {Object.entries(NavbarList).map(([key, value]) => {
              const isAlert = key === "แจ้งเหตุ";

              return (
                // เพิ่ม relative และ flex ให้กับ li หากเป็นปุ่มแจ้งเหตุ เพื่อใช้รองรับ Effect ออร่า
                <li key={key} className={isAlert ? "relative flex items-center justify-center" : ""}>
                  {isAlert ? (
                    <>
                      {/* Aura Effect (คลื่นกระเพื่อมด้านหลังปุ่ม) */}

                      {/* Actual Button (ตัวปุ่มหลัก นิ่งและชัดเจน) */}
                      <a
                        href={value}
                        className="relative flex items-center justify-center gap-2 bg-red-600 text-white font-bold px-6 py-2.5 rounded-md shadow-lg hover:bg-red-500 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {key}
                      </a>
                    </>
                  ) : (
                    <a
                      href={value}
                      className="block py-2 px-3 text-green-50 rounded-md hover:text-white hover:bg-green-700 md:hover:bg-transparent md:hover:text-green-300 md:p-0 transition-colors duration-200 font-medium"
                    >
                      {key}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
	)
}
