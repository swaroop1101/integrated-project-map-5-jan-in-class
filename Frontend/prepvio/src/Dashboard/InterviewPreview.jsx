import React, { useState, useEffect } from "react";
import { PhoneOff, MessageSquare, Code, X, ListChecks, ArrowLeft } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";

// Reuse the 3D Model (static version - no speech)
function StaticModel(props) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb');

  useEffect(() => {
    Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
  }, [materials]);

  if (!nodes?.rp_carla_rigged_001_geo) return null;

  return (
    <group
      {...props}
      position={[-0.48, -1.3, 3.967]}
      rotation={[1.9, 0, 0]}
      scale={0.01}
      dispose={null}
    >
      <skinnedMesh
        geometry={nodes.rp_carla_rigged_001_geo.geometry}
        material={nodes.rp_carla_rigged_001_geo.material}
        skeleton={nodes.rp_carla_rigged_001_geo.skeleton}
        morphTargetInfluences={nodes.rp_carla_rigged_001_geo.morphTargetInfluences || []}
        morphTargetDictionary={nodes.rp_carla_rigged_001_geo.morphTargetDictionary || {}}
      />
      <primitive object={nodes.root} />
    </group>
  );
}

// Solved Problems Modal (reused from InterviewScreen)
const SolvedProblemsModal = ({ isOpen, onClose, problems }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex p-4">
      <div className="bg-gray-900 text-white w-full max-w-5xl mx-auto rounded-lg shadow-xl overflow-hidden flex">
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-green-400">Solved Problems</h2>

          {problems.length === 0 && (
            <p className="text-gray-400 text-sm">No problems solved yet.</p>
          )}

          {problems.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(p)}
              className="w-full text-left p-3 mb-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              {p.problem.title}
              <p className="text-xs text-gray-400">
                {new Date(p.solvedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {!selected && (
            <p className="text-gray-300">Select a solved problem to view details.</p>
          )}

          {selected && (
            <>
              <h2 className="text-2xl font-bold text-green-400 mb-4">
                {selected.problem.title}
              </h2>

              {selected.skipped && (
                <p className="text-red-400 font-bold mb-3">
                  This problem was skipped.
                </p>
              )}

              <p className="text-gray-300 whitespace-pre-line mb-4">
                {selected.problem.description}
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">
                  Your Solution
                </h3>

                {selected.skipped ? (
                  <p className="text-gray-400 italic">No code submitted for this problem.</p>
                ) : (
                  <Editor
                    height="200px"
                    language="javascript"
                    value={selected.userCode}
                    theme="vs-dark"
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                )}
              </div>

              <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                Test Case Results
              </h3>

              {selected.skipped ? (
                <p className="text-gray-400 italic">No test results available.</p>
              ) : (
                selected.testResults.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 mb-2 rounded border ${
                      r.passed
                        ? "bg-green-900 border-green-600"
                        : "bg-red-900 border-red-600"
                    }`}
                  >
                    <p><strong>Input:</strong> {r.input}</p>
                    <p><strong>Expected:</strong> {r.expected}</p>
                    <p><strong>Output:</strong> {r.output}</p>
                    <p><strong>Status:</strong> {r.passed ? "Passed ✔" : "Failed ✘"}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const InterviewPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [chatMessages, setChatMessages] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [showSolvedProblems, setShowSolvedProblems] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from localStorage first (for new tab opening)
    const storedData = localStorage.getItem("interviewPreviewData");
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        
        // Check if data is not stale (within 5 minutes)
        const now = Date.now();
        if (data.timestamp && (now - data.timestamp) < 5 * 60 * 1000) {
          setInterviewData(data);
          setChatMessages(data.messages || []);
          setSolvedProblems(data.solvedProblems || []);
          setLoading(false);
          
          // Clear localStorage after loading
          localStorage.removeItem("interviewPreviewData");
          return;
        }
      } catch (err) {
        console.error("Failed to parse preview data:", err);
      }
    }

    // Fallback: check location.state
    if (location.state?.previewSession) {
      const data = location.state.previewSession;
      setInterviewData(data);
      setChatMessages(data.messages || []);
      setSolvedProblems(data.solvedProblems || []);
      setLoading(false);
    } else {
      // No data available
      setLoading(false);
    }
  }, [location.state]);

  const handleBack = () => {
    navigate("/dashboard/interview-analysis");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading preview...
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="text-xl mb-4">No interview data available</p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Interviews
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-white/50 rounded-full transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {interviewData.companyType} — {interviewData.role}
                </h1>
                <p className="text-sm text-gray-600">
                  Interview Preview (Read-Only)
                </p>
              </div>
            </div>

            <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Preview Mode
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6">

            {/* Left: Blank Video Area */}
            <div className="col-span-2 relative">
              <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-900 h-[420px] relative flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-lg">Video Recording Not Available</p>
                  <p className="text-sm mt-2">This is a replay of the interview conversation</p>
                </div>
              </div>

              {/* Interview Stats */}
              <div className="mt-6 bg-white/50 backdrop-blur rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Interview Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Messages</p>
                    <p className="font-semibold text-gray-900">{chatMessages.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Problems Solved</p>
                    <p className="font-semibold text-gray-900">{solvedProblems.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Your Responses</p>
                    <p className="font-semibold text-gray-900">
                      {chatMessages.filter(m => m.sender === "User").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">AI Questions</p>
                    <p className="font-semibold text-gray-900">
                      {chatMessages.filter(m => m.sender === "AI").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">

              {/* Static AI Model */}
              <div className="relative rounded-xl overflow-hidden shadow-lg h-48 bg-black">
                <Canvas camera={{ position: [0, 0, 5] }}>
                  <ambientLight intensity={0.6} />
                  <Environment preset="studio" />
                  <StaticModel />
                </Canvas>

                <div className="absolute bottom-4 left-4 bg-indigo-200/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
                  <span className="text-sm font-medium text-gray-800">
                    Ms. Jenny (Replay)
                  </span>
                </div>
              </div>

              {/* Conversation History */}
              <div className="bg-white/50 backdrop-blur rounded-xl p-4 flex flex-col h-[360px]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Conversation History
                  </h4>
                  
                  {solvedProblems.length > 0 && (
                    <button
                      onClick={() => setShowSolvedProblems(true)}
                      className="p-2 hover:bg-white/50 rounded-full transition"
                      title="View Solved Problems"
                    >
                      <ListChecks className="w-5 h-5 text-indigo-600" />
                    </button>
                  )}
                </div>

                {/* Scrollable Messages */}
                <div className="flex-1 overflow-y-auto pr-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-10">
                      No conversation history available
                    </p>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`mb-4 ${
                          msg.sender === "User" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[85%] px-4 py-3 rounded-lg shadow ${
                            msg.sender === "User"
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {msg.sender === "User" ? "You" : "Jenny"}
                          </p>
                          <p className="text-sm">{msg.text}</p>
                          
                          {msg.time && (
                            <p className="text-xs mt-1 opacity-60">
                              {msg.time}
                            </p>
                          )}

                          {/* Show feedback if available */}
                          {msg.feedback && (
                            <div className="mt-3 pt-3 border-t border-white/20">
                              <p className="text-xs font-semibold mb-1">Feedback:</p>
                              <p className="text-xs">{msg.feedback.suggestion}</p>
                              {msg.feedback.example && (
                                <p className="text-xs mt-1 italic">
                                  Example: {msg.feedback.example}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {msg.stage && (
                          <p className="text-xs text-gray-500 mt-1">
                            Stage: {msg.stage}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Read-only notice */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center italic">
                    This is a read-only preview. No interactions available.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Solved Problems Modal */}
          {showSolvedProblems && (
            <SolvedProblemsModal
              isOpen={showSolvedProblems}
              onClose={() => setShowSolvedProblems(false)}
              problems={solvedProblems}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPreview;