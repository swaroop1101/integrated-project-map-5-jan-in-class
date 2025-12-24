import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, FileText, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Interview = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);

  // ✅ UPDATED: Pass full interview data to preview
  const handlePreview = (interview) => {
    if (!interview) {
      alert("Interview data missing");
      return;
    }

    // Store in localStorage for new tab access
    localStorage.setItem(
      "interviewPreviewData",
      JSON.stringify({
        role: interview.role,
        companyType: interview.companyType,
        messages: interview.messages || [],
        solvedProblems: interview.solvedProblems || [],
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        timestamp: Date.now(),
      })
    );

    // Open in new tab
    window.open("/interview-preview", "_blank", "noopener,noreferrer");
  };

  const openReport = (url) => {
    if (!url) {
      alert("Report not available for this interview yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true); // ✅ Set loading to true before fetching
        const res = await axios.get(
          "http://localhost:5000/api/interview-session/my",
          { withCredentials: true }
        );
        setInterviews(res.data.interviews || []);
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
        // Optionally show error to user
        alert("Failed to load interviews. Please try again.");
      } finally {
        setLoading(false); // ✅ CRITICAL FIX: Set loading to false after fetch completes
      }
    };

    fetchInterviews();

    window.addEventListener("focus", fetchInterviews);
    return () => window.removeEventListener("focus", fetchInterviews);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading interviews...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-6">
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white/30 backdrop-blur-2xl border border-white/50 shadow-lg rounded-3xl p-6 min-h-screen">

          {/* Header */}
          <div className="pb-4 border-b border-white/50 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Search className="w-6 h-6 text-indigo-600" />
              Interview Reports
            </h2>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-lg transition ${
                  view === "list" 
                    ? "bg-white/70 shadow" 
                    : "bg-white/40 hover:bg-white/50"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setView("timeline")}
                className={`px-4 py-2 rounded-lg transition ${
                  view === "timeline" 
                    ? "bg-white/70 shadow" 
                    : "bg-white/40 hover:bg-white/50"
                }`}
              >
                Timeline View
              </button>
            </div>
          </div>

          {/* Content */}
          {interviews.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No interviews completed yet.</p>
              <p className="text-gray-500 text-sm mt-2">
                Complete an interview to see your reports here.
              </p>
            </div>
          ) : (
            <>
              {/* LIST VIEW */}
              {view === "list" && (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div
                      key={interview._id}
                      className="bg-white/50 border border-white/30 rounded-2xl p-6 hover:shadow-lg transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {interview.role} Interview
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {interview.companyType}
                          </p>
                          
                          <div className="flex gap-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(interview.startedAt), "PP")}
                            </div>
                            {interview.completedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(interview.completedAt), "p")}
                              </div>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex gap-4 mt-3 text-xs">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                              {interview.messages?.length || 0} messages
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              {interview.solvedProblems?.length || 0} problems
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(interview)}
                            disabled={!interview.messages || interview.messages.length === 0}
                            className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Preview
                          </button>

                          <button
                            onClick={() => openReport(interview.reportUrl)}
                            disabled={!interview.reportUrl}
                            className="px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TIMELINE VIEW */}
              {view === "timeline" && (
                <div className="relative space-y-8 pl-8">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                  {[...interviews]
                    .sort(
                      (a, b) =>
                        new Date(b.startedAt) - new Date(a.startedAt)
                    )
                    .map((interview, idx) => (
                      <div key={interview._id} className="flex gap-6 relative">
                        <div className="absolute -left-[21px] z-10">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="bg-white/50 border border-white/30 rounded-2xl p-6 w-full hover:shadow-lg transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {interview.role} Interview
                              </h3>
                              <p className="text-sm text-gray-600">
                                {interview.companyType}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {format(new Date(interview.startedAt), "PPP p")}
                              </p>

                              {/* Stats */}
                              <div className="flex gap-4 mt-3 text-xs">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                                  {interview.messages?.length || 0} messages
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                  {interview.solvedProblems?.length || 0} problems
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePreview(interview)}
                                disabled={!interview.messages || interview.messages.length === 0}
                                className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Preview
                              </button>

                              <button
                                onClick={() => openReport(interview.reportUrl)}
                                disabled={!interview.reportUrl}
                                className="px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                View PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Interview;