import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ---------------- Selection Button (LOGIC UNCHANGED) ---------------- */

const SelectionButton = ({
  value,
  options,
  onSelect,
  disabled = false,
  placeholder,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleWarning, setRoleWarning] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const displayValue = value || placeholder;

  return (
    <div
      className={`relative w-full max-w-md ${className}`}
      ref={ref}
    >
      <button
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          } else {
            setRoleWarning(true);
            setTimeout(() => setRoleWarning(false), 3000);
          }
        }}
        disabled={disabled}
        className={`
          w-full px-5 py-4 rounded-xl text-left border transition
          ${
            disabled
              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
              : "bg-white/70 backdrop-blur text-gray-800 border-gray-300 hover:bg-white"
          }
        `}
      >
        <span className={!value ? "text-gray-400" : ""}>
          {displayValue}
        </span>
      </button>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
                setIsOpen(false);
              }}
              className={`px-5 py-3 cursor-pointer flex justify-between items-center hover:bg-indigo-50
                ${value === option ? "bg-indigo-100 font-semibold" : ""}
              `}
            >
              {option}
              {value === option && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          ))}
        </div>
      )}

      {roleWarning && disabled && (
        <p className="text-sm text-red-500 text-center mt-2">
          Please select a Company Type first.
        </p>
      )}
    </div>
  );
};

/* ---------------- Main Page ---------------- */

const SelectRolesAndCompany = ({
  companyType,
  setCompanyType,
  role,
  setRole,
}) => {
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

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
      navigate("/services/check-your-ability/rounds");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-10 space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Check Your Ability
          </h1>
          <p className="text-gray-600 text-base">
            Choose a company type and role to begin your mock interview
          </p>
        </div>

        {/* Selectors */}
        <div className="flex flex-col items-center gap-6">
          <SelectionButton
            placeholder="Select Company Type"
            value={companyType}
            options={companies}
            onSelect={handleCompanySelect}
          />

          <SelectionButton
            placeholder="Select Role"
            value={role}
            options={roles}
            onSelect={handleRoleSelect}
            disabled={!companyType}
          />
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-white/50 flex justify-center">
          <button
            onClick={handleStartInterview}
            disabled={!companyType || !role}
            className={`
              px-10 py-4 rounded-full text-lg transition
              ${
                companyType && role
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-[1.03]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            Start Your Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRolesAndCompany;
