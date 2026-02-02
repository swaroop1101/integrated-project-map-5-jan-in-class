import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Sparkles, ArrowRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../../store/authstore.js";

/* ---------------- 
  Improved Selection Button with Search & Scrolling
---------------- */
const SelectionButton = ({
  value,
  options,
  onSelect,
  disabled = false,
  placeholder,
  className = "",
  dropdownDirection = "down",
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleWarning, setRoleWarning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef();
  const searchInputRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && options.length > 5) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, options.length]);

  const displayValue = value || placeholder;

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option && option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          } else {
            setRoleWarning(true);
            setTimeout(() => setRoleWarning(false), 3000);
          }
        }}
        disabled={disabled}
        className={`
          w-full px-6 py-4 rounded-2xl text-left border-2 transition-all font-medium
          ${
            disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white/90 backdrop-blur-sm text-gray-900 border-gray-200 hover:border-[#D4F478] hover:bg-white shadow-sm hover:shadow-md"
          }
          flex items-center justify-between
        `}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {displayValue}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={20}
        />
      </button>

      <AnimatePresence>
        {isOpen && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: dropdownDirection === "up" ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownDirection === "up" ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden ${
              dropdownDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {/* Search bar for long lists */}
            {options.length > 5 && showSearch && (
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4F478] focus:border-transparent text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Scrollable options list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: options.length > 8 ? "320px" : "auto",
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`
                      px-6 py-3.5 cursor-pointer flex justify-between items-center transition-all
                      ${
                        value === option
                          ? "bg-[#D4F478]/20 font-semibold text-gray-900"
                          : "hover:bg-gray-50 text-gray-700 hover:pl-8"
                      }
                      border-b border-gray-100 last:border-b-0
                    `}
                  >
                    <span className="flex-1 pr-2">{option}</span>
                    {value === option && (
                      <Check size={18} className="text-[#D4F478] flex-shrink-0" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning message */}
      <AnimatePresence>
        {roleWarning && disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-amber-50 border-2 border-amber-300 text-amber-800 rounded-xl text-sm font-medium shadow-lg"
          >
            ⚠️ Please select a Company Type first.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------------- 
  Main Page (Matching Home.js theme)
---------------- */
const SelectRolesAndCompany = ({
  companyType,
  setCompanyType,
  role,
  setRole,
}) => {
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.subscription?.interviewsRemaining <= 0) {
      alert(
        "⚠️ You have no interview credits remaining. Please upgrade your plan."
      );
      navigate("/dashboard/pricing", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/companies");
        if (Array.isArray(res.data)) setCompanies(res.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!companyType) {
        setRoles([]);
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:5000/api/companies/roles/${encodeURIComponent(
            companyType
          )}`
        );
        if (Array.isArray(res.data)) {
          setRoles(res.data.map((r) => (typeof r === "string" ? r : r.name)));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      }
    };
    fetchRoles();
  }, [companyType]);

  const handleCompanySelect = (type) => {
    setCompanyType(type);
    setRole(null);
  };

  const handleRoleSelect = (selectedRole) => {
    if (companyType) setRole(selectedRole);
  };

  const handleStartInterview = () => {
    if (companyType && role) {
      navigate("/services/check-your-ability/interview/rounds");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#D4F478]/10 relative overflow-hidden">
      {/* Background decorations matching Home.js */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4F478]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* Floating decoration */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 right-20 pointer-events-none"
      >
        <Sparkles className="text-[#D4F478]" size={40} />
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 pt-20 pb-12 px-4"
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4F478]/20 rounded-full mb-6">
            <Sparkles size={18} className="text-gray-700" />
            <span className="text-sm font-semibold text-gray-700">
              AI-Powered Practice
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Check Your Ability
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose a company type and role to begin your mock interview
            experience
          </p>
        </div>
      </motion.div>

      {/* Selectors */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-2xl mx-auto px-4 pb-20"
      >
        <motion.div variants={itemVariants} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
              Company Type
            </label>
            <SelectionButton
              value={companyType}
              options={companies}
              onSelect={handleCompanySelect}
              placeholder="Select a company type"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
              Role
            </label>
            <SelectionButton
              value={role}
              options={roles}
              onSelect={handleRoleSelect}
              disabled={!companyType}
              placeholder={
                companyType
                  ? "Select a role"
                  : "First select a company type"
              }
              dropdownDirection="up"
              showSearch={false}
            />
          </div>
        </motion.div>

        {/* CTA matching Home.js button style */}
        <motion.div variants={itemVariants} className="mt-10">
          <button
            onClick={handleStartInterview}
            disabled={!companyType || !role}
            className={`
              w-full px-8 py-5 rounded-2xl font-bold text-lg
              transition-all duration-300 transform
              flex items-center justify-center gap-3 group
              ${
                companyType && role
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Start Your Interview
            <ArrowRight
              className={`transition-transform ${
                companyType && role ? "group-hover:translate-x-1" : ""
              }`}
              size={24}
            />
          </button>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          variants={itemVariants}
          className="mt-8 text-center text-sm text-gray-500 font-medium"
        >
          Step 2 of 3
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SelectRolesAndCompany;