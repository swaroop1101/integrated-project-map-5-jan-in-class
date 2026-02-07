import React from 'react';
import { Eye, Lock, Globe, Database } from 'lucide-react';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Privacy Settings</h1>
                    <p className="text-slate-500 font-bold mb-8">Manage your public visibility and data settings.</p>

                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                                    <Globe className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Public Profile</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Allow others to find your profile</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" defaultChecked name="toggle1" id="toggle1" className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-md transform translate-x-6 transition-transform" />
                                <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-8 rounded-full bg-emerald-500 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                    <Database className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Data Collection</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Allow us to collect usage data to improve experience</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" defaultChecked name="toggle2" id="toggle2" className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-md transform translate-x-6 transition-transform" />
                                <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-8 rounded-full bg-emerald-500 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                                    <Eye className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Activity Status</h3>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Show when you are active to other admins</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle3" id="toggle3" className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer shadow-md transform translate-x-0 transition-transform" />
                                <label htmlFor="toggle3" className="toggle-label block overflow-hidden h-8 rounded-full bg-slate-300 cursor-pointer"></label>
                            </div>
                        </div>

                        <div className="mt-8 p-8 bg-red-50 rounded-3xl border border-red-100 hover:shadow-lg hover:shadow-red-100/50 transition-all">
                            <h3 className="text-xl font-black text-red-700 mb-2">Delete Account</h3>
                            <p className="text-sm font-bold text-red-500/80 mb-6">Permanently remove your account and all associated data. This action cannot be undone.</p>
                            <button className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 hover:-translate-y-0.5">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
