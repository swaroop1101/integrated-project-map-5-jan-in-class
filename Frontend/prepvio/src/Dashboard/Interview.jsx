import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const Interview = () => {
  const [interviews, setInterviews] = useState([]);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/interview-session/my",
          { withCredentials: true }
        );

        setInterviews(res.data.interviews || []);
      } catch (err) {
        console.error("Failed to fetch interviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const openReport = (url) => {
    if (!url) {
      alert("Report not available for this interview yet.");
      return;
    }
    window.open(url, "_blank");
  };

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
                className={`px-4 py-2 rounded-lg ${
                  view === "list" ? "bg-white/70" : "bg-white/40"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setView("timeline")}
                className={`px-4 py-2 rounded-lg ${
                  view === "timeline" ? "bg-white/70" : "bg-white/40"
                }`}
              >
                Timeline View
              </button>
            </div>
          </div>

          {/* Content */}
          {interviews.length === 0 ? (
            <p className="text-gray-600 text-center mt-10">
              No interviews completed yet.
            </p>
          ) : (
            <>
              {view === "list" && (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div
                      key={interview._id}
                      onClick={() => openReport(interview.reportUrl)}
                      className="cursor-pointer bg-white/50 hover:bg-white/70 border border-white/30 rounded-2xl p-6 transition"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {interview.role} Interview
                      </h3>

                      <p className="text-sm text-gray-600">
                        {interview.companyType}
                      </p>

                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(interview.startedAt), "PPP")}
                        <Clock className="w-3 h-3 ml-2" />
                        {format(new Date(interview.startedAt), "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {view === "timeline" && (
                <div className="relative space-y-8">
                  <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-300"></div>

                  {[...interviews]
                    .sort(
                      (a, b) =>
                        new Date(b.startedAt) - new Date(a.startedAt)
                    )
                    .map((interview) => (
                      <div key={interview._id} className="flex gap-6">
                        <div className="relative z-10">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div
                          onClick={() => openReport(interview.reportUrl)}
                          className="cursor-pointer bg-white/50 hover:bg-white/70 border border-white/30 rounded-2xl p-6 w-full transition"
                        >
                          <h3 className="text-lg font-semibold text-gray-800">
                            {interview.role} Interview
                          </h3>
                          <p className="text-sm text-gray-600">
                            {interview.companyType}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(interview.startedAt),
                              "PPP p"
                            )}
                          </p>
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
