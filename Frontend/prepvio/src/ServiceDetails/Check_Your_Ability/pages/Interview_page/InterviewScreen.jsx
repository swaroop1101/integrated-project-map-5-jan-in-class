import React, { useState, useEffect, useCallback, useRef } from "react";
import { PhoneOff, MessageSquare, Code, Maximize, Minimize, X, Mic, ListChecks } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useLocation } from "react-router-dom";


// --- Code Editor Modal Component (fixed + robust) ---
const CodeEditorModal = ({ isOpen, onClose, problem, onSuccess, onSkip }) => {
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const [initialEditorValue, setInitialEditorValue] = useState("// Waiting for coding problem...");

  if (!isOpen) return null;

  // Generate a sensible boilerplate if problem.boilerplate missing
  const generateBoilerplateFromProblem = (problemObj, lang) => {
    if (!problemObj) return "// Waiting for coding problem...";

    const titleLine = `// ${problemObj.title || "Coding Challenge"}`;
    const descLines = problemObj.description
      ? problemObj.description.split("\n").map((l) => `// ${l}`).join("\n")
      : "";
    const header = `${titleLine}\n${descLines}\n\n`;

    if (lang === "javascript") {
      const pb = (problemObj.boilerplate && problemObj.boilerplate.javascript) || "";
      if (pb) return pb;
      const fnName = problemObj.functionName || "solve";
      return `${header}// Implement ${fnName}\nfunction ${fnName}(${problemObj.params || ""}) {\n  // TODO\n}\n\n// Example invocation\n// console.log(${fnName}(${(problemObj.testCases && problemObj.testCases[0] && problemObj.testCases[0].input) || ""}));`;
    }

    if (lang === "python") {
      const pb = (problemObj.boilerplate && problemObj.boilerplate.python) || "";
      if (pb) return pb;
      const fnName = problemObj.functionName || "solve";
      return `${header}def ${fnName}(${problemObj.params || ""}):\n    # TODO\n    pass\n\n# Example:\n# print(${fnName}(${(problemObj.testCases && problemObj.testCases[0] && problemObj.testCases[0].input) || ""}))`;
    }

    if (lang === "cpp") {
      const pb = (problemObj.boilerplate && problemObj.boilerplate.cpp) || "";
      if (pb) return pb;
      const fnName = problemObj.functionName || "solve";
      return `${header}#include <bits/stdc++.h>\nusing namespace std;\n\n// Implement ${fnName}\nint main() {\n  // TODO: implement and print output\n  return 0;\n}`;
    }

    return problemObj.boilerplate?.[lang] || header;
  };

  useEffect(() => {
    // update the initial editor content when problem or language changes
    const val = generateBoilerplateFromProblem(problem, language);
    setInitialEditorValue(val);
    if (editorRef.current && typeof editorRef.current.setValue === "function") {
      // ensure editor shows the latest problem + language
      editorRef.current.setValue(val);
    }
  }, [problem, language]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // ensure the value is set on mount as well
    const val = generateBoilerplateFromProblem(problem, language);
    setInitialEditorValue(val);
    try {
      editor.setValue(val);
    } catch (e) {
      // ignore setValue errors
    }
  };

  const handleRun = async () => {
    const code = editorRef.current?.getValue();
    if (!code || !problem?.testCases) {
      setOutput([{ id: 0, output: "⚠️ No test cases available!" }]);
      return;
    }

    setLoading(true);
    setOutput([{ id: 0, output: "⏳ Running test cases..." }]);

    try {
      const results = [];
      let allPassed = true;

      for (let i = 0; i < problem.testCases.length; i++) {
        const test = problem.testCases[i];
        const args = test.input;

        const executionBoilerplate =
          language === "python"
            ? `\n\nprint(${problem.functionName}(${args}))`
            : language === "cpp"
            ? `\n#include <iostream>\nint main() {\n  std::cout << ${problem.functionName}(${args}) << std::endl;\n  return 0;\n}`
            : `\n\nconsole.log(${problem.functionName}(${args}));`;

        const userCode = `${code}\n${executionBoilerplate}`;

        const res = await fetch("http://localhost:5000/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code: userCode }),
        });

        const data = await res.json();
        const result = (data.run?.output || data.run?.stderr || "").toString().trim() || "No output";

        const passed = result === (test.expected || "").toString().trim();
        if (!passed) allPassed = false;

        results.push({
          id: i + 1,
          input: test.input,
          expected: test.expected,
          output: result,
          passed,
        });
      }

      setOutput(results);

      if (allPassed) {
        const finalUserCode = editorRef.current.getValue();
        setTimeout(() => {
          onSuccess(finalUserCode, results);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setOutput([{ id: 0, output: "❌ Execution error. Check backend connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-7xl max-h-[95vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-800 px-6 py-4 border-b border-gray-700 rounded-t-lg">
          <h2 className="text-xl font-semibold text-white">Code Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Problem Description */}
          <div className="w-1/3 border-r border-gray-700 overflow-auto bg-gray-800 p-6">
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              {problem?.title || "No Problem Loaded"}
            </h3>

            {problem?.companies && problem.companies.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-400 uppercase">Asked in Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {problem.companies.map((company, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs font-medium border border-blue-700"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-300 mb-4 text-base leading-relaxed">
              {problem?.description || "Waiting for the interviewer to assign a coding problem..."}
            </p>

            {problem?.example && (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="text-yellow-300 font-semibold mb-2 text-lg">Example</h4>
                <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap">
                  {problem.example}
                </pre>
              </div>
            )}

            {problem?.testCases && problem.testCases.length > 0 && (
              <div>
                <h4 className="text-cyan-300 font-semibold mb-3 text-lg">Test Cases</h4>
                <ul className="list-disc ml-5 text-gray-300 space-y-1">
                  {problem.testCases.map((test, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium">Input:</span> {test.input} → <span className="font-medium">Expected:</span> {test.expected}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-[#252526] px-4 py-2 border-b border-gray-700">
              <select
                className="bg-[#1e1e1e] text-gray-200 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
              <button
                onClick={handleRun}
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 transform hover:scale-105"
                }`}
              >
                {loading ? "Running..." : "Run Code"}
              </button>

              <button
                onClick={() => {
                  const finalUserCode = editorRef.current?.getValue() || null;
                  onSkip(finalUserCode);
                }}
                className="px-4 py-2 ml-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                Skip
              </button>

            </div>

            <Editor
              height="60%"
              theme="vs-dark"
              language={language === "cpp" ? "cpp" : language}
              value={initialEditorValue}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: "Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorSmoothCaretAnimation: true,
                renderWhitespace: "none",
                lineNumbers: "on",
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />

            {/* Output Console */}
            <div className="h-40 bg-gray-950 text-white p-4 overflow-auto border-t border-gray-700 font-mono">
              <h4 className="text-cyan-400 font-bold mb-3 text-xl">Execution Results</h4>
              {Array.isArray(output) ? (
                output.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded mb-3 border ${
                      res.id === 0
                        ? "bg-gray-700 border-gray-600"
                        : res.passed
                        ? "bg-green-900 border-green-700"
                        : "bg-red-900 border-red-700"
                    }`}
                  >
                    {res.id !== 0 ? (
                      <>
                        <strong className="text-lg">Test {res.id}:</strong>{" "}
                        <span
                          className={`font-bold ${
                            res.passed ? "text-green-300" : "text-red-300"
                          }`}
                        >
                          {res.passed ? "PASSED" : "FAILED"}
                        </span>
                        <div className="mt-1 text-sm">
                          <span className="text-gray-400 block">Input: {res.input}</span>
                          <span className="text-gray-400 block">Expected: {res.expected}</span>
                          <span className="text-gray-400 block">
                            Output: <span className="text-white whitespace-pre-wrap">{res.output}</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-white">{res.output}</div>
                    )}
                  </div>
                ))
              ) : (
                <pre className="text-red-400">{output}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SolvedProblemsModal = ({ isOpen, onClose, problems }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex p-4">
      <div className="bg-gray-900 text-white w-full max-w-5xl mx-auto rounded-lg shadow-xl overflow-hidden flex">

        {/* Sidebar list */}
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

        {/* Details Section */}
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

              {/* Read-only editor */}
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


              {/* Test results */}
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

// --- Enhanced Model Component with Dynamic Speech ---
function DynamicModel({ speechText, onSpeechEnd, ...props }) {
  const { nodes, materials } = useGLTF('/final_prepvio_model.glb');
  const meshRef = useRef();
  const headBoneRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    Object.values(materials || {}).forEach((mat) => (mat.morphTargets = true));
  }, [materials]);

  const letterToViseme = {
    a: 'aa', b: 'PP', c: 'CH', d: 'DD', e: 'E', f: 'FF',
    g: 'DD', h: 'sil', i: 'E', k: 'DD', l: 'nn', m: 'PP',
    n: 'nn', o: 'oh', p: 'PP', r: 'aa', s: 'SS', t: 'DD',
    u: 'oh', v: 'FF', w: 'oh', x: 'SS', y: 'E', z: 'SS',
    ' ': 'sil'
  };

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [chars, setChars] = useState([]);
  const morphKeys = nodes?.rp_carla_rigged_001_geo?.morphTargetDictionary || {};

  useEffect(() => {
  if (!speechText) {
    setChars([]);
    setCurrentCharIndex(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 1.2;

  // --- FEMALE VOICE SELECTION ---
  let voices = window.speechSynthesis.getVoices();

  const setFemaleVoice = () => {
    voices = window.speechSynthesis.getVoices();
    const femaleVoice =
      voices.find(v => v.name.toLowerCase().includes("female")) ||
      voices.find(v => v.name.toLowerCase().includes("woman")) ||
      voices.find(v => v.name.toLowerCase().includes("samantha")) || // iOS/macOS
      voices.find(v => v.name.toLowerCase().includes("zira")) ||     // Windows
      voices.find(v => v.name.toLowerCase().includes("google us")) ||// Chrome
      voices[0];

    utterance.voice = femaleVoice;
  };

  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = setFemaleVoice;
  } else {
    setFemaleVoice();
  }

  utterance.onend = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentCharIndex(0);
    if (onSpeechEnd) onSpeechEnd();
  };

  utterance.onerror = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onSpeechEnd) onSpeechEnd();
  };

  // --- SPEAK WITH FEMALE VOICE ---
  window.speechSynthesis.speak(utterance);

  const textChars = speechText.toLowerCase().split('');
  setChars(textChars);

  let i = 0;
  intervalRef.current = setInterval(() => {
    if (i < textChars.length) {
      setCurrentCharIndex(i);
      i++;
    } else {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, 150);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [speechText, onSpeechEnd]);


  useEffect(() => {
    if (nodes?.rp_carla_rigged_001_geo?.skeleton) {
      const head = nodes.rp_carla_rigged_001_geo.skeleton.bones.find((b) =>
        b.name.toLowerCase().includes('head')
      );
      if (head) headBoneRef.current = head;
    }
  }, [nodes]);

  const offsetY = useRef(Math.random() * 0.08);
  const offsetX = useRef(Math.random() * 0.05);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(t * 0.4 + offsetY.current) * 0.02;
      headBoneRef.current.rotation.x = Math.sin(t * 0.3 + offsetX.current) * 0.04;
    }

    if (meshRef.current?.morphTargetInfluences && chars.length > 0) {
      const influences = meshRef.current.morphTargetInfluences;
      influences.fill(0);

      const char = chars[currentCharIndex];
      if (char) {
        const viseme = letterToViseme[char] || 'oh';
        const index = morphKeys[viseme];
        if (index !== undefined) influences[index] = 0.8;
      }
    }
  });

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
        ref={meshRef}
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

useGLTF.preload('/final_prepvio_model.glb');

// --- API Constants ---
const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const BACKEND_UPLOAD_URL = "/api/upload";
const apiKey = "fw_3ZbHnsRsTg9cHxxESpgxzMim";

// --- Utilities: format problem for chat (keeps chat+editor in sync) ---
const generateReportContent = (messages, company, role) => {
  let content = `--- Mock Interview Report ---\n\n`;
  content += `Role: ${role}\n`;
  content += `Company Type: ${company}\n`;
  content += `Date: ${new Date().toLocaleDateString()}\n\n`;
  content += `--- Conversation Log ---\n\n`;

  messages.forEach((msg) => {
    content += `${msg.sender}: ${msg.text}\n`;

    if (msg.sender === "User" && msg.feedback) {
      const suggestion = msg.feedback.suggestion || "";
      const example = msg.feedback.example || "";
      content += `[Feedback]: ${suggestion}|||${example}\n`;
    }
  });

  content += `\n=== FINAL ANALYSIS ===\n\n`;
  content += `**Overall Performance Summary**\n`;
  content += `This interview covered both HR and technical aspects for the ${role} position.\n\n`;

  content += `**Key Strengths Observed**\n`;
  content += `- Engaged actively throughout the conversation\n`;
  content += `- Demonstrated willingness to learn and improve\n\n`;

  content += `**General Recommendations**\n`;
  content += `1. Continue practicing technical concepts relevant to ${role}\n`;
  content += `2. Use the STAR method for behavioral questions\n`;
  content += `3. Build small projects to demonstrate practical skills\n`;
  content += `4. Review feedback provided after each response above\n`;

  return content;
};

// --- Main InterviewScreen (fixed) ---
const InterviewScreen = ({
  companyType = "Tech Startup",
  role = "Full Stack Developer",
  setStage = () => {},
  userId = "user1"
}) => {
  const userVideoRef = useRef(null);
  const screenRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechBufferRef = useRef("");
const location = useLocation();

const isPreview = location.state?.isPreview === true;
const previewSession = location.state?.previewSession;



  

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewStage, setInterviewStage] = useState("intro");
  const [currentAiSpeech, setCurrentAiSpeech] = useState("");
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codingProblem, setCodingProblem] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [showSolvedProblems, setShowSolvedProblems] = useState(false);
  const [deviationWarnings, setDeviationWarnings] = useState(0);

  const captureFrame = () => {
  const video = userVideoRef.current;
  if (!video) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.6);
};


  // NEW: track how many coding problems attempted in this coding round
  const [codingCount, setCodingCount] = useState(0);

  const navigate = useNavigate();

  const endInterview = useCallback(() => {
    console.log("Interview ended and resources cleaned.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.currentMediaStream) {
      window.currentMediaStream.getTracks().forEach(track => track.stop());
      window.currentMediaStream = null;
    }
    if (userVideoRef.current?.srcObject) {
      userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      userVideoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsSpeaking(false);
    setIsRecording(false);
    setGreeted(false);
    setChatMessages([]);
    setError(null);
    console.log("✅ All media and states cleared.");
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("refreshFlag", "true");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    if (sessionStorage.getItem("refreshFlag") === "true") {
      sessionStorage.removeItem("refreshFlag");
      endInterview();
      navigate("/", { replace: true });
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate, endInterview]);

  useEffect(() => {
  if (isPreview && previewSession?.messages) {
    setChatMessages(previewSession.messages);
    setSolvedProblems(previewSession.solvedProblems || []);
    setCameraAllowed(true); // bypass loader screen
  }
}, [isPreview, previewSession]);


  // Add this hook in your InterviewScreen component
// Replace the existing useEffect for frame capture

// Replace your frame capture useEffect with this debugged version

useEffect(() => {
  const sessionId = location.state?.sessionId;
  
  if (!sessionId) {
    console.warn("⚠️ No sessionId found - nervousness detection disabled");
    return;
  }

  console.log("📹 Starting nervousness detection for session:", sessionId);

  let frameCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const interval = setInterval(() => {
    frameCount++;
    
    const frame = captureFrame();
    
    if (!frame) {
      console.warn(`⚠️ Frame ${frameCount}: Capture returned null`);
      return;
    }

    // Log first frame details for debugging
    if (frameCount === 1) {
      console.log("📸 First frame captured:", {
        length: frame.length,
        prefix: frame.substring(0, 30) + "..."
      });
    }

    fetch("http://127.0.0.1:5050/analyze-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId,
        frame: frame
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      successCount++;
      
      if (data.nervous && data.imagePath) {
        console.log(`🟡 Frame ${frameCount}: NERVOUS detected (${data.score.toFixed(2)})`);
        
        // Store in backend memory
        return fetch("http://localhost:5000/api/nervous-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId,
            imagePath: data.imageBase64,
            score: data.score
          })
        });
      } else {
        console.log(`✅ Frame ${frameCount}: Analyzed (score: ${data.score?.toFixed(2) || "N/A"})`);
      }
    })
    .catch(err => {
      errorCount++;
      console.error(`❌ Frame ${frameCount} failed:`, err.message);
      
      // Log stats every 10 errors
      if (errorCount % 10 === 0) {
        console.warn(`📊 Stats: ${successCount} success, ${errorCount} errors out of ${frameCount} frames`);
      }
    });
  }, 4000); // Every 4 seconds

  return () => {
    clearInterval(interval);
    console.log(`📹 Detection stopped. Final stats: ${successCount} success, ${errorCount} errors out of ${frameCount} frames`);
  };
}, [location.state?.sessionId]);


  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = (e) => {
      console.log("⬅️ User navigated back — ending interview and blocking forward navigation");

      window.history.pushState(null, "", window.location.pathname);

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (userVideoRef.current?.srcObject) {
        userVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        userVideoRef.current.srcObject = null;
      }
      if (window.currentMediaStream) {
        window.currentMediaStream.getTracks().forEach(track => track.stop());
        window.currentMediaStream = null;
      }

      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    return () => {
      endInterview();
    };
  }, [endInterview]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatHistoryForFireworks = useCallback((history) => {
    return history.map((msg) => ({
      role: msg.sender === "AI" ? "assistant" : "user",
      content: msg.text,
    }));
  }, []);

  const fetchFireworksContent = useCallback(async (messages, systemInstruction) => {
    const messagesWithSystem = [
      { role: "system", content: systemInstruction },
      ...messages
    ];

    try {
      const res = await fetch(FIREWORKS_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/deepseek-v3p1",
          messages: messagesWithSystem
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", errorText);
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      return data?.choices?.[0]?.message?.content || "No response";
    } catch (err) {
      console.error("Fireworks API Error:", err);
      throw err;
    }
  }, []);

  const generateFeedbackForAnswer = useCallback(async (userAnswer, aiQuestion) => {
    try {
      const feedbackPrompt = `You are an interview coach analyzing a candidate's answer.

Previous Question: "${aiQuestion}"
Candidate's Answer: "${userAnswer}"

Provide constructive feedback in this EXACT format (no additional text):
SUGGESTION: [One specific improvement suggestion in 1-2 sentences]
EXAMPLE: [A better way to phrase the answer in 1 sentence]

Keep it concise and actionable.`;

      const feedbackMessages = [
        { role: "user", content: feedbackPrompt }
      ];

      const feedbackText = await fetchFireworksContent(feedbackMessages, "You are a helpful interview coach providing brief, actionable feedback.");

      const suggestionMatch = feedbackText.match(/SUGGESTION:\s*(.+?)(?=EXAMPLE:|$)/s);
      const exampleMatch = feedbackText.match(/EXAMPLE:\s*(.+?)$/s);

      return {
        suggestion: suggestionMatch ? suggestionMatch[1].trim() : "Keep practicing to improve your interview responses.",
        example: exampleMatch ? exampleMatch[1].trim() : ""
      };
    } catch (err) {
      console.error("Feedback generation error:", err);
      return {
        suggestion: "Consider providing more specific examples from your experience.",
        example: "Try structuring your answer with concrete details about what you did and what you achieved."
      };
    }
  }, [fetchFireworksContent]);

  // --- STEP 1: Centralized Coding Problem Generator (used to fetch exactly one canonical problem) ---
  const fetchAndFormatCodingProblem = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/interview/fireworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error("Failed to generate coding problem");
      }

      const data = await response.json();

      // CASE 1: Backend gives clean JSON
      if (data.title && data.description && data.testCases) {
        return {
          problem: data,
          questionText: formatProblemForChat(data)
        };
      }

      // CASE 2: Backend gives wrapped JSON text inside Fireworks format
      const raw = data?.choices?.[0]?.message?.content?.trim() || "";
      let clean = raw.replace(/```json|```/g, "");
      const objMatch = clean.match(/\{[\s\S]*\}/);

      if (!objMatch) {
        const fallback = {
          title: "Coding Challenge",
          description: raw,
          example: "",
          testCases: []
        };
        return {
          problem: fallback,
          questionText: formatProblemForChat(fallback)
        };
      }

      const parsed = JSON.parse(objMatch[0]);
      return {
        problem: parsed,
        questionText: formatProblemForChat(parsed)
      };

    } catch (err) {
      console.error("Coding problem fetch error:", err);
      throw err;
    }
  }, []);

  // --- Formats problem into readable chat message ---
  const formatProblemForChat = useCallback((problem) => {
    const title = problem.title || "Coding Challenge";
    const desc = problem.description || "";
    const example = problem.example ? `Example:\n${problem.example}` : "";
    const tests = problem.testCases?.length
      ? "\nTest Cases:\n" +
        problem.testCases.map(
          (tc, i) => `${i + 1}. Input: ${tc.input} → Expected: ${tc.expected}`
        ).join("\n")
      : "";

    return `${title}\n\n${desc}\n\n${example}${tests}\n\nYou can use the Code Editor to solve this problem.`;
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    setCurrentAiSpeech("");
    setTimeout(() => startSpeechRecognition(), 500);
  }, []);

  const textToSpeech = useCallback((text) => {
    if (!text) return;
    setIsSpeaking(true);
    setCurrentAiSpeech(text);
  }, []);

  // Remove any earlier "generateCodingProblem" that auto-opens editor.
  // The editor will now be opened only when AI asks a coding question and we fetch one canonical problem.

  const handleSendMessage = useCallback(
  async (text) => {
    const messageToSend = text.trim();
    if (!messageToSend || isLoadingAI || isSpeaking) return;

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }

    setError(null);
    setInputValue("");

    const lastAiMessage =
      chatMessages.filter((m) => m.sender === "AI").slice(-1)[0];
    const lastAiQuestion = lastAiMessage ? lastAiMessage.text : "";

    const userMsg = {
      sender: "User",
      text: messageToSend,
      time: new Date().toLocaleTimeString(),
      stage: interviewStage,
      feedback: null,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // -----------------------------------------
    // COUNT QUESTIONS PER STAGE
    // -----------------------------------------
    const aiCount = (stage) =>
      chatMessages.filter(
        (m) => m.sender === "AI" && m.stage === stage
      ).length;

    const introQ = aiCount("intro");
    const transQ = aiCount("transition");
    const techQ = aiCount("technical");

    // -----------------------------------------
    // STAGE TRANSITIONS (NO DEADLOCKS)
    // -----------------------------------------

    // INTRO → TRANSITION
    if (interviewStage === "intro" && introQ >= 2) {
      const msg =
        "Great. Let’s move forward. I’ll now ask you a few pre-technical questions.";
      setInterviewStage("transition");
      setIsLoadingAI(false);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: msg,
          time: new Date().toLocaleTimeString(),
          stage: "transition",
        },
      ]);

      textToSpeech(msg);
      return;
    }

    // TRANSITION → TECHNICAL
    if (interviewStage === "transition" && transQ >= 1) {
      const msg =
        "Now let’s begin the technical round. I’ll ask you concept-based questions.";
      setInterviewStage("technical");
      setIsLoadingAI(false);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: msg,
          time: new Date().toLocaleTimeString(),
          stage: "technical",
        },
      ]);

      textToSpeech(msg);
      return;
    }

    // TECHNICAL → CODING
    if (interviewStage === "technical" && techQ >= 4) {
      const msg =
        "That concludes the technical round. We will now move to the coding round.";

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: msg,
          time: new Date().toLocaleTimeString(),
          stage: "technical",
        },
      ]);

      textToSpeech(msg);

      setTimeout(async () => {
        setInterviewStage("coding");
        try {
          const { problem } = await fetchAndFormatCodingProblem();
          setCodingProblem(problem);

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: "Your first coding problem is ready. Please open the Code Editor.",
              time: new Date().toLocaleTimeString(),
              stage: "coding",
            },
          ]);

          setTimeout(() => setIsCodeEditorOpen(true), 600);
        } catch (err) {
          setError("Failed to generate coding problem.");
        }
      }, 1000);

      return;
    }

    // -----------------------------------------
    // NORMAL AI QUESTION FLOW
    // -----------------------------------------
    setIsLoadingAI(true);

    try {
  let systemInstruction = "";

  if (interviewStage === "intro")
    systemInstruction = `
You are an AI interviewer in the INTRO round.

RULES:
- Ask ONLY ONE question.
- Question length MUST be between 20 and 25 words.
- Ask an introductory HR question.
- Do NOT add explanations, examples, or follow-ups.
`;

  else if (interviewStage === "transition")
    systemInstruction = `
You are an AI interviewer in the TRANSITION round.

RULES:
- Ask ONLY ONE light technical or conceptual question.
- Question length MUST be between 20 and 25 words.
- No coding questions.
- No explanations or follow-ups.
`;

  else if (interviewStage === "technical")
    systemInstruction = `
You are an AI interviewer in the TECHNICAL round.

RULES:
- Ask ONLY ONE theory-based technical question.
- Question length MUST be between 20 and 25 words.
- No coding problems.
- No multi-part questions.
`;

  else if (interviewStage === "coding")
    systemInstruction = `
You are in the CODING round.
Do NOT ask questions. Wait for the user to solve the problem.
`;

  else if (interviewStage === "final")
    systemInstruction = `
You are an AI interviewer in the FINAL round.

RULES:
- Ask ONLY ONE wrap-up HR question.
- Question length MUST be between 20 and 25 words.
- Be concise and professional.
`;

  const formattedHistory = formatHistoryForFireworks([
    ...chatMessages,
    userMsg,
  ]);

  const aiReplyRaw = await fetchFireworksContent(
    formattedHistory,
    systemInstruction
  );

  // 🔒 HARD SAFETY: trim to max 25 words
  const aiReply = aiReplyRaw
    .split(" ")
    .slice(0, 25)
    .join(" ");

  const feedback = await generateFeedbackForAnswer(
    messageToSend,
    lastAiQuestion
  );

  setChatMessages((prev) => {
    const updated = [...prev];
    const idx = updated.map((m) => m.sender).lastIndexOf("User");
    if (idx !== -1) updated[idx].feedback = feedback;
    return updated;
  });

  setChatMessages((prev) => [
    ...prev,
    {
      sender: "AI",
      text: aiReply,
      time: new Date().toLocaleTimeString(),
      stage: interviewStage,
    },
  ]);

  textToSpeech(aiReply);
}
catch (err) {
      console.error("AI Error:", err);
      setError("AI failed to respond.");
    } finally {
      setIsLoadingAI(false);
    }
  },
  [
    isLoadingAI,
    isSpeaking,
    chatMessages,
    interviewStage,
    formatHistoryForFireworks,
    fetchFireworksContent,
    generateFeedbackForAnswer,
    fetchAndFormatCodingProblem,
    textToSpeech,
  ]
);



  const startSpeechRecognition = useCallback(() => {
  if (isLoadingAI || isSpeaking) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setError("Speech Recognition not supported in this browser.");
    return;
  }

  // NEW: buffer to store spoken text reliably
  const speechBufferRefLocal = speechBufferRef; 
  speechBufferRefLocal.current = "";

  if (recognitionRef.current && isRecording) {
    recognitionRef.current.stop();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognitionRef.current = recognition;

  recognition.onstart = () => {
    setIsRecording(true);
    setError(null);
  };

  let autoSendTimer = null;

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(result => result[0].transcript)
      .join("");

    // Store transcript in REF (✔ FIX)
    speechBufferRefLocal.current = transcript;
    setInputValue(transcript);

    if (autoSendTimer) {
      clearTimeout(autoSendTimer);
      autoSendTimer = null;
    }
  };

  recognition.onerror = (e) => {
    console.error("Speech Recognition Error:", e);
    if (e.error !== "no-speech") {
      setError("Error in speech recognition: " + e.error);
    }
    setIsRecording(false);
  };

  recognition.onend = () => {
    setIsRecording(false);
    recognitionRef.current = null;

    // Auto-send after 3 seconds of silence
    autoSendTimer = setTimeout(() => {
      const finalText = speechBufferRefLocal.current.trim();

      if (finalText) {
        handleSendMessage(finalText);
        speechBufferRefLocal.current = "";
      }
    }, 3000);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error("Recognition start failed:", e);
    setIsRecording(false);
  }
}, [isLoadingAI, isSpeaking, isRecording, handleSendMessage]);


  // Replace your existing handleEndInterview in InterviewScreen.jsx with this:

const handleEndInterview = useCallback(async () => {
  if (isLoadingAI || isSpeaking) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }

  const reportText = generateReportContent(chatMessages, companyType, role);
  const sanitizedRole = role.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  const filename = `${sanitizedRole}_Report_${timestamp}.pdf`;

  setIsLoadingAI(true);
  setError("Analyzing the Interview");

  try {
    // 1️⃣ Upload PDF
    const response = await fetch(BACKEND_UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        content: reportText,
        role,
        companyType,
        solvedProblems,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || "Upload failed");
    }

    console.log("✅ Uploaded Report URL:", data.publicUrl);

    // 2️⃣ Save to InterviewSession in DB (with messages and solved problems)
    const sessionId = location.state?.sessionId;

    if (sessionId) {
      await fetch(
        `http://localhost:5000/api/interview-session/complete/${sessionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reportUrl: data.publicUrl,
            messages: chatMessages, // ✅ Send messages
            solvedProblems: solvedProblems, // ✅ Send solved problems
          }),
        }
      );
      
      console.log("✅ Interview session updated with messages and solved problems");
    } else {
      console.warn("⚠️ No sessionId found. Interview not linked in DB.");
    }

    // 3️⃣ Optional local storage (UI convenience)
    localStorage.setItem(
      "interviewReport",
      JSON.stringify({
        role,
        companyType,
        reportUrl: data.publicUrl,
        timestamp: new Date().toISOString(),
      })
    );

    setError("✅ Report saved! Redirecting to summary page...");

    setTimeout(() => {
      setError(null);
      navigate("/after-interview", { replace: true });
    }, 2500);
  } catch (err) {
    console.error("❌ Interview completion failed:", err);
    setError(`❌ Report upload failed: ${err.message}`);
  } finally {
    setIsLoadingAI(false);
  }
}, [
  chatMessages,
  solvedProblems, // ✅ Add to dependencies
  companyType,
  role,
  isLoadingAI,
  isSpeaking,
  navigate,
  location,
]);


  useEffect(() => {
  if (isPreview) return;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setCameraAllowed(true);
      userVideoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera/Mic access denied.");
    }
  };

  startCamera();
}, [isPreview]);


  // --- Remove any "auto-generate coding question before greeting" logic.
  // Editor will be opened only when AI asks a coding question and we fetch one canonical problem.

  useEffect(() => {
    if (cameraAllowed && companyType && role && !greeted) {
      const startAiConversation = async () => {
        try {
          const greetingPrompt = `
You are Jenny, the AI interviewer.

Your strict name is: "Jenny, your AI interviewer".
Never refer to yourself as anything else.

You are a friendly professional interviewer for a ${role} at a ${companyType}.
Start the mock interview. Greet the candidate professionally, mention the company type "${companyType}" and the role "${role}",
then begin with an appropriate first question (example: "Can you tell me about yourself?").
`;


          setIsLoadingAI(true);
          setChatMessages([]);

          const initialMessages = [
            { role: "user", content: "Start the interview introduction." },
          ];

          const aiQ = await fetchFireworksContent(initialMessages, greetingPrompt);

          const firstMsg = {
            sender: "AI",
            text: aiQ,
            time: new Date().toLocaleTimeString(),
          };
          setChatMessages([firstMsg]);
          await textToSpeech(aiQ);
          setGreeted(true);
        } catch (error) {
          console.error("Error sending initial greeting:", error);
          setError(error.message || "Failed to start AI conversation");
        } finally {
          setIsLoadingAI(false);
        }
      };
      startAiConversation();
    }
  }, [cameraAllowed, companyType, role, greeted, fetchFireworksContent, textToSpeech]);

  const toggleFullScreen = async () => {
    const elem = screenRef.current;
    if (!document.fullscreenElement) {
      await elem.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  if (!cameraAllowed && !error) {
    return (
      <div className="text-center mt-20 text-lg text-gray-700">
        Requesting camera and microphone permission...
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {companyType} — {role}
            </h1>
            <p className="text-sm text-gray-600">
              Live AI-powered mock interview
            </p>
          </div>

          <button
            onClick={handleEndInterview}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center gap-2"
          >
            <PhoneOff size={18} />
            End Interview
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Main Video */}
          <div className="col-span-2 relative">
            <div className="rounded-2xl overflow-hidden shadow-lg bg-black h-[420px] relative">
               <div className="absolute top-4 left-4 bg-indigo-200/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-300 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700">
                    TS
                  </div>
                  <span className="text-sm font-medium text-gray-800">Mrs. Tania Shahira</span>
                </div>
              {isPreview ? (
  <div className="w-full h-full bg-black flex items-center justify-center text-gray-400">
    Video disabled in preview
  </div>
) : (
  <video
    ref={userVideoRef}
    autoPlay
    playsInline
    muted
    className="w-full h-full object-cover scale-x-[-1]"
  />
)}


              {/* AI Speaking Indicator */}
              {isSpeaking && (
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm animate-pulse">
                  Jenny is speaking…
                </div>
              )}

              

              {/* Control Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">

  {/* Mic */}
  <button
    onClick={startSpeechRecognition}
    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
      isRecording ? "bg-red-500" : "bg-white"
    }`}
  >
    <Mic className={isRecording ? "text-white" : "text-gray-700"} />
  </button>

  {/* Chat */}
  <button
    onClick={() => setIsChatOpen(true)}
    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
  >
    <MessageSquare className="text-gray-700" />
  </button>

  {/* Code Editor */}
  <button
    onClick={() => setIsCodeEditorOpen(true)}
    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
  >
    <Code className="text-gray-700" />
  </button>

  {/* Solved Problems */}
  {solvedProblems.length > 0 && (
    <button
      onClick={() => setShowSolvedProblems(true)}
      className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-indigo-50 transition"
      title="View Solved Problems"
    >
      <ListChecks className="text-indigo-600" />
    </button>
  )}
</div>

            </div>

            {/* Notes */}
            <div className="mt-6 bg-white/50 backdrop-blur rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                Interview Progress
              </h3>
              <p className="text-sm text-gray-600">
                Current Stage: <strong>{interviewStage}</strong>
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">

            {/* AI Video */}
            <div className="relative rounded-xl overflow-hidden shadow-lg h-48 bg-black">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.6} />
                <Environment preset="studio" />
                <DynamicModel
                  speechText={currentAiSpeech}
                  onSpeechEnd={handleSpeechEnd}
                />
              </Canvas>

             <div className="absolute bottom-4 left-4 bg-indigo-200/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
  <span className="text-sm font-medium text-gray-800">
    Ms. Jenny
  </span>
</div>

            </div>

            {/* Question List */}
            <div className="bg-white/50 backdrop-blur rounded-xl p-4 flex flex-col h-[360px]">

  {/* Messages (SCROLLABLE) */}
  <div className="flex-1 overflow-y-auto pr-2">
    <h4 className="font-semibold text-gray-900 mb-3">
      Conversation
    </h4>

    {chatMessages.map((msg, idx) => (
      <div
        key={idx}
        className={`mb-3 text-sm ${
          msg.sender === "User"
            ? "text-right text-indigo-700"
            : "text-left text-gray-800"
        }`}
      >
        <p className="inline-block px-3 py-2 rounded-lg bg-white shadow">
          {msg.text}
        </p>
      </div>
    ))}

    {isLoadingAI && (
      <p className="text-sm text-gray-500 italic">
        Jenny is thinking…
      </p>
    )}
  </div>

  {/* INPUT BAR (FIXED, ALWAYS VISIBLE) */}
  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && inputValue.trim()) {
          handleSendMessage(inputValue);
        }
      }}
      placeholder="Type your answer here (testing)…"
      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />

    <button
      onClick={() => handleSendMessage(inputValue)}
      disabled={!inputValue.trim() || isLoadingAI || isSpeaking}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm disabled:opacity-50"
    >
      Send
    </button>
  </div>
</div>

          </div>
        </div>

        {/* Modals */}
        {isCodeEditorOpen && (
  <CodeEditorModal
    isOpen={isCodeEditorOpen}
    onClose={() => setIsCodeEditorOpen(false)}
    problem={codingProblem}

    onSuccess={async (userCode, testResults) => {
      // Save solved problem
      setSolvedProblems((prev) => [
        ...prev,
        {
          problem: codingProblem,
          userCode,
          testResults,
          skipped: false,
          solvedAt: new Date().toISOString(),
        },
      ]);

      setIsCodeEditorOpen(false);

      // Increase coding count
      setCodingCount((prev) => prev + 1);

      setTimeout(async () => {
        const nextCount = codingCount + 1;

        // If 3 problems completed → end coding round
        if (nextCount >= 3) {
          const msg =
            "Great work! That concludes the coding round. We will now move to the next round.";

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "post-coding",
            },
          ]);

          textToSpeech(msg);
          setInterviewStage("final");
          return;
        }

        // Otherwise fetch next problem
        try {
          const { problem: nextProblem } =
            await fetchAndFormatCodingProblem();

          setCodingProblem(nextProblem);

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text:
                "A new coding problem has been generated. Please open the Code Editor to solve it.",
              time: new Date().toLocaleTimeString(),
              stage: "coding",
            },
          ]);

          setTimeout(() => setIsCodeEditorOpen(true), 500);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch next coding problem.");
        }
      }, 300);
    }}

    onSkip={async () => {
      // Save skipped problem
      setSolvedProblems((prev) => [
        ...prev,
        {
          problem: codingProblem,
          userCode: null,
          testResults: null,
          skipped: true,
          solvedAt: new Date().toISOString(),
        },
      ]);

      setIsCodeEditorOpen(false);

      setCodingCount((prev) => prev + 1);

      setTimeout(async () => {
        const nextCount = codingCount + 1;

        if (nextCount >= 3) {
          const msg =
            "That concludes the coding round. Let's move to the next round.";

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: msg,
              time: new Date().toLocaleTimeString(),
              stage: "post-coding",
            },
          ]);

          textToSpeech(msg);
          setInterviewStage("final");
          return;
        }

        try {
          const { problem: nextProblem } =
            await fetchAndFormatCodingProblem();

          setCodingProblem(nextProblem);

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text:
                "A new coding problem has been generated. Please open the Code Editor to solve it.",
              time: new Date().toLocaleTimeString(),
              stage: "coding",
            },
          ]);

          setTimeout(() => setIsCodeEditorOpen(true), 500);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch next coding problem.");
        }
      }, 300);
    }}
  />
)}


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

export default InterviewScreen;
