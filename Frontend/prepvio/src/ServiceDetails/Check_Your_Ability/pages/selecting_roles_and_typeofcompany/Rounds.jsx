import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";

const Rounds = ({ companyType, role }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/companies/${encodeURIComponent(
            companyType
          )}/${encodeURIComponent(role)}/rounds`
        );
        setRounds(res.data.rounds || []);
      } catch (err) {
        console.error("Error fetching rounds:", err);
      } finally {
        setLoading(false);
      }
    };

    if (companyType && role) fetchRounds();
  }, [companyType, role]);

  const handleStartInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());

      const res = await axios.post(
        "http://localhost:5000/api/interview-session/start",
        { companyType, role },
        { withCredentials: true }
      );

      const sessionId = res.data.sessionId;

      navigate("/services/check-your-ability/interview", {
        state: {
          companyType,
          role,
          rounds,
          sessionId,
          preventBack: true,
        },
        replace: true,
      });
    } catch (error) {
      console.error(error);
      alert("⚠️ Please allow camera access or login again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Loading interview rounds…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-10 space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Rounds
          </h1>
          <p className="text-gray-600 text-base">
            Practice interview for{" "}
            <span className="font-semibold text-indigo-600">
              {companyType}
            </span>{" "}
            —{" "}
            <span className="font-semibold text-indigo-600">
              {role}
            </span>
          </p>
        </div>

        {/* Rounds List */}
        <div className="space-y-4">
          {rounds.length > 0 ? (
            rounds.map((round, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-lg border border-white/50 rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-1">
                  {round.name}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {round.description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 italic">
              No rounds configured for this role.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-white/50">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-gray-400 text-gray-700 bg-white hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
            Change Selection
          </button>

          <button
            onClick={handleStartInterview}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-[1.03] transition"
          >
            <PlayCircle size={20} />
            Start Practice Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rounds;
