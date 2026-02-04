import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Star, Users, Clock, Search, ArrowRight, BookOpen, Code, Database, PenTool, Sparkles, ArrowLeft, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../../components/UserAvatar.jsx";
import { useAuthStore } from "../../store/authstore.js";


// Animation for floating stickers
const floatVariants = {
  animate: {
    y: [0, -15, 0],
    rotate: [0, 10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatReverseVariants = {
  animate: {
    y: [0, 15, 0],
    rotate: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5,
    },
  },
};

function LearnAndPerform() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");


  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setIsProfileDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const [coursesRes, categoriesRes] = await Promise.all([
          axios.get("/api/courses"),
          axios.get("/api/categories")
        ]);

        // 1. Handle Courses
        const coursesData = Array.isArray(coursesRes.data)
          ? coursesRes.data
          : (coursesRes.data.courses || coursesRes.data.data || []);

        setCourses(coursesData);

        // 2. Handle Categories (Matches Admin Logic)
        let rawCategories = [];
        const catResponse = categoriesRes.data;

        // Check various ways backend might send data
        if (Array.isArray(catResponse)) {
          rawCategories = catResponse;
        } else if (catResponse.data && Array.isArray(catResponse.data)) {
          rawCategories = catResponse.data;
        } else if (catResponse.categories && Array.isArray(catResponse.categories)) {
          rawCategories = catResponse.categories;
        }

        // Extract names
        const categoryNames = rawCategories.map((cat) => {
          return typeof cat === 'object' ? cat.name : cat;
        });

        const uniqueCategories = ["All", ...new Set(categoryNames.filter(Boolean))];
        setCategories(uniqueCategories);

      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ UPDATED FILTERING LOGIC (Matches Admin Panel)
  const filteredCourses = courses.filter((course) => {
    // 1. Search Logic
    const courseName = course.name || course.title || '';
    const matchesSearch = courseName.toLowerCase().includes(search.toLowerCase());

    // 2. Category Logic
    if (selectedCategory === "All") return matchesSearch;

    // ⬇️ THIS IS THE FIX FROM YOUR ADMIN CODE ⬇️
    // We check 'categoryId' first (Admin style), then fallback to 'category'
    const categoryObj = course.categoryId || course.category;

    // Extract the name safely
    const courseCategoryName = categoryObj?.name || "Uncategorized";

    // Compare
    const matchesCategory = courseCategoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black relative overflow-x-hidden">

      {/* GLOBAL BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none -z-50">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-t from-pink-50 to-transparent rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 pb-20">

        {/* COMBINED NAVIGATION BAR - Back Button + User Avatar */}
        <div className="flex items-center justify-between mb-6 relative z-50">
          {/* Back to Home Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-black font-bold transition-colors group"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          {/* User Avatar / Sign In Button */}
          {isAuthenticated && user ? (
            <div className="relative" ref={profileDropdownRef}>
              <UserAvatar
                image={user.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                name={user.name}
                onClick={handleProfileClick}
              />
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-2xl border border-white rounded-[1.5rem] shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <button onClick={handleDashboardClick} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                    </button>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors">
              Sign In
            </button>
          )}
        </div>


        {/* HERO SECTION */}
        <div className="max-w-5xl mx-auto relative mb-16">
          <motion.div variants={floatVariants} animate="animate" className="absolute -top-6 -left-6 md:top-0 md:-left-12 z-20 hidden sm:block">
            <div className="bg-[#D4F478] p-4 rounded-2xl shadow-xl transform -rotate-12 border-2 border-black">
              <Code className="w-6 h-6 md:w-8 md:h-8 text-black" />
            </div>
          </motion.div>

          <motion.div variants={floatReverseVariants} animate="animate" className="absolute top-1/2 -right-4 md:-right-12 z-20 hidden sm:block">
            <div className="bg-white p-4 rounded-2xl shadow-xl transform rotate-12 border-2 border-black">
              <Database className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div variants={floatVariants} animate="animate" className="absolute -bottom-8 left-10 md:left-20 z-20 hidden sm:block">
            <div className="bg-pink-200 p-3 rounded-full shadow-xl transform rotate-6 border-2 border-white">
              <PenTool className="w-5 h-5 md:w-6 md:h-6 text-pink-700" />
            </div>
          </motion.div>

          <div className="absolute top-10 right-10 z-20 opacity-60 pointer-events-none hidden md:block">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <path d="M10,50 Q30,10 50,50 T90,50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
              <circle cx="80" cy="20" r="4" fill="#D4F478" />
              <circle cx="20" cy="80" r="4" fill="#D4F478" />
            </svg>
          </div>

          <div className="bg-[#1A1A1A] rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl shadow-gray-900/20">
            <div className="absolute top-6 right-6 z-20 bg-red-500 text-white text-xs font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg transform rotate-6 border border-red-400">
              New Courses
            </div>

            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
              <img
                src="https://res.cloudinary.com/dknafbwlt/image/upload/v1756976555/samples/ecommerce/leather-bag-gray.jpg"
                alt="Background"
                className="w-full h-full object-cover grayscale"
              />
            </div>

            <div className="relative z-10 space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 mb-2">
                <Sparkles className="w-4 h-4 text-[#D4F478]" />
                <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">AI-Powered Learning</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[1.1] md:leading-[0.9] tracking-tight">
                Your Prepvio <br />
                <span className="text-gray-500 block mt-2 text-xl sm:text-2xl md:text-4xl">Dream Big. Learn Fast.</span>
              </h1>

              <div className="relative max-w-lg mx-auto mt-6 md:mt-8 group">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-[#D4F478]/30 transition-colors duration-500" />
                <div className="relative flex items-center bg-white rounded-full p-1.5 md:p-2 shadow-xl">
                  <div className="pl-4 md:pl-6 text-gray-400">
                    <Search className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <input
                    type="text"
                    placeholder="What to learn?"
                    className="flex-1 px-3 md:px-4 py-3 text-base md:text-lg font-medium text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none w-full min-w-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="bg-[#1A1A1A] text-white px-5 md:px-8 py-3 md:py-4 rounded-full font-bold hover:bg-black transition-colors flex items-center gap-2 text-sm md:text-base shrink-0">
                    Explore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORIES TABS */}
        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex justify-start md:justify-center gap-2 md:gap-3 min-w-max px-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border ${selectedCategory === category
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-black/20 transform scale-105"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-20 bg-red-50 rounded-[2.5rem] border border-red-100">
            <p className="text-red-600 font-bold">{error}</p>
          </div>
        )}

        {!loading && !error && filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No courses found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or category filter.</p>
          </div>
        )}

        {/* COURSES GRID */}
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} navigate={navigate} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Course Card Component
const CourseCard = ({ course, navigate }) => {
  // Safe Access to Category Name for Display
  const categoryName = course.categoryId?.name || course.category?.name || "General";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/services/learn-and-perform/${course._id}`)}
      className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 cursor-pointer flex flex-col h-full group relative overflow-hidden"
    >
      <div className="relative h-48 md:h-52 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-gray-100 mb-5">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/400x300/F3F4F6/9CA3AF?text=${course.name ? course.name.substring(0, 2) : "CO"}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-gray-900">{course.rating ? course.rating.toFixed(1) : "4.5"}</span>
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 bg-[#1A1A1A]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/20">
            {categoryName}
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 flex-1 flex flex-col">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {course.name || course.title}
        </h3>

        <div className="flex items-center gap-4 text-gray-400 text-xs font-medium mb-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{course.students ? course.students.toLocaleString() : "500"} Students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Self-paced</span>
          </div>
        </div>

        <button className="mt-auto w-full bg-gray-50 text-gray-900 py-3 md:py-4 rounded-xl font-bold text-sm hover:bg-[#D4F478] hover:text-black transition-all group/btn flex items-center justify-center gap-2">
          View Course
          <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default LearnAndPerform;