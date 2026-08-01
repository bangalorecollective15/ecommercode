"use client";

import { useState, useEffect } from "react";
import {
    Globe,
    Save,
    Instagram,
    Youtube,
    Facebook,
    FileText,
    Loader2,
    Edit3,
    ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

export default function SiteInfoAdminPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditingTexts, setIsEditingTexts] = useState(false);
    const [isEditingSocials, setIsEditingSocials] = useState(false);

    // Separate State Track Matrix matching your DB tables
    const [siteTexts, setSiteTexts] = useState({
        short_description: "",
        long_description: ""
    });

    const [socialLinks, setSocialLinks] = useState({
        instagram: "",
        youtube: "",
        snapchat: "",
        facebook: "",
        whatsapp: "",
        google: ""
    });

    // Fetch data on initial component mount
    const fetchSiteInformation = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/site-info");
            const data = await res.json();

            if (data) {
                setSiteTexts({
                    short_description: data.short_description ?? "",
                    long_description: data.long_description ?? ""
                });
                setSocialLinks({
                    instagram: data.instagram ?? "",
                    youtube: data.youtube ?? "",
                    snapchat: data.snapchat ?? "",
                    facebook: data.facebook ?? "",
                    whatsapp: data.whatsapp ?? "",
                    google: data.google ?? ""
                });
            }
        } catch (error) {
            toast.error("Failed to load node registry metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSiteInformation();
    }, []);

    // Update logic to send payload to your backend database API endpoint
    const handleUpdateRecord = async (type: "texts" | "socials") => {
        setSaving(true);
        try {
            const payload = type === "texts" ? siteTexts : socialLinks;
            const res = await fetch("/api/site-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, ...payload }),
            });

            if (!res.ok) throw new Error();

            toast.success("Metadata Node Updated Successfully");
            if (type === "texts") setIsEditingTexts(false);
            if (type === "socials") setIsEditingSocials(false);
        } catch (err) {
            toast.error("Protocol update mutation failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#FBFBFC]">
            <Loader2 className="w-12 h-12 text-[#c4a174] animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FBFBFC] text-[#2b2652] font-sans selection:bg-[#c4a174] selection:text-white p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#2b2652] flex items-center justify-center shadow-lg shadow-[#2b2652]/20">
                                <Globe className="text-[#c4a174] w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Platform Settings</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                            Website <span className="text-[#c4a174] italic">Information</span>
                        </h1>
                    </div>
                </div>

                {/* SECTION 1: WEBSITE DESCRIPTION MANAGEMENT SINGLE ROW ROW TABLE */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                            <FileText size={14} className="text-[#c4a174]" /> Core Copywriting Index
                        </h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-10 py-6 w-[30%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Short Description</th>
                                        <th className="px-10 py-6 w-[55%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Long Description Profile</th>
                                        <th className="px-10 py-6 w-[15%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="group bg-white transition-colors">
                                        <td className="px-10 py-8 align-top">
                                            {isEditingTexts ? (
                                                <input
                                                    type="text"
                                                    value={siteTexts.short_description}
                                                    onChange={(e) => setSiteTexts({ ...siteTexts, short_description: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 font-medium text-xs text-[#2b2652] focus:border-[#c4a174] focus:outline-none uppercase tracking-wider"
                                                />
                                            ) : (
                                                <div className="font-black text-xs text-[#2b2652] uppercase tracking-wider max-w-xs leading-relaxed">
                                                    {siteTexts.short_description || <span className="text-slate-300 italic">No value compiled</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 align-top">
                                            {isEditingTexts ? (
                                                <textarea
                                                    rows={4}
                                                    value={siteTexts.long_description}
                                                    onChange={(e) => setSiteTexts({ ...siteTexts, long_description: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-100 rounded-2xl bg-slate-50 font-medium text-xs text-[#2b2652] focus:border-[#c4a174] focus:outline-none leading-relaxed"
                                                />
                                            ) : (
                                                <div className="text-xs font-medium text-slate-500 max-w-xl leading-relaxed whitespace-pre-wrap">
                                                    {siteTexts.long_description || <span className="text-slate-300 italic">No entry logs mapped to registry</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 align-top">
                                            <div className="flex justify-end">
                                                {isEditingTexts ? (
                                                    <button
                                                        disabled={saving}
                                                        onClick={() => handleUpdateRecord("texts")}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#c4a174] text-[#2b2652] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2b2652] hover:text-white transition active:scale-95 shadow-lg shadow-[#c4a174]/20"
                                                    >
                                                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />} Save Row
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsEditingTexts(true)}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#2b2652] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition active:scale-95 shadow-xl shadow-[#2b2652]/10"
                                                    >
                                                        <Edit3 size={14} /> Alter Data
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: SOCIAL COMMUNICATIONS MEDIA ROUTING SINGLE ROW TABLE */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                            <Instagram size={14} className="text-[#c4a174]" /> Social Matrix & Gateway Links
                        </h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-[#2b2652]/5 border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 w-[30%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Platform Gateway</th>
                                        <th className="px-8 py-5 w-[50%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Link Mapping Configuration</th>
                                        <th className="px-8 py-5 w-[20%] text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* ROW 1: BLOCKS 1, 2, 3 */}
                                    {[
                                        { key: "instagram", label: "Instagram Mapping" },
                                        { key: "youtube", label: "YouTube Channel" },
                                        { key: "snapchat", label: "Snapchat Index" },
                                        // ROW 2: BLOCKS 4, 5, 6
                                        { key: "facebook", label: "Facebook Gateway" },
                                        { key: "whatsapp", label: "WhatsApp Secure Portal" },
                                        { key: "google", label: "Google Listing Node" }
                                    ].map(({ key, label }, index) => {
                                        const currentValue = socialLinks[key as keyof typeof socialLinks];

                                        return (
                                            <tr key={key} className={`group bg-white transition-colors ${index !== 5 ? 'border-b border-slate-50' : ''}`}>
                                                {/* COLUMN 1: PLATFORM NAME */}
                                                <td className="px-8 py-5 align-middle">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                                                        Ref ID: 0{index + 1}
                                                    </span>
                                                    <div className="font-bold text-xs text-[#2b2652] uppercase tracking-wide">
                                                        {label}
                                                    </div>
                                                </td>

                                                {/* COLUMN 2: INTERACTIVE DATA MATRIX CELL */}
                                                <td className="px-8 py-5 align-middle">
                                                    {isEditingSocials ? (
                                                        <input
                                                            type="text"
                                                            value={currentValue}
                                                            onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                                                            className="w-full max-w-xl px-4 py-2.5 border border-slate-100 rounded-xl bg-slate-50 text-xs font-medium text-[#2b2652] focus:border-[#c4a174] focus:outline-none"
                                                            placeholder={`Insert ${key} route target URL...`}
                                                        />
                                                    ) : (
                                                        <div className="truncate max-w-xl text-xs font-bold tracking-tight">
                                                            {currentValue ? (
                                                                <a
                                                                    href={
                                                                        key === "whatsapp" && !currentValue.startsWith("http") && !currentValue.startsWith("tel")
                                                                            ? `https://wa.me/${currentValue.replace(/[^0-9]/g, "")}`
                                                                            : currentValue.startsWith("http")
                                                                                ? currentValue
                                                                                : `https://${currentValue}`
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-emerald-600 hover:text-[#2b2652] transition-colors inline-flex items-center gap-1.5 group/link bg-emerald-50/50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-emerald-100/40"
                                                                >
                                                                    <span className="font-black text-[10px] uppercase tracking-wider">Launch Vector Link</span>
                                                                    <ExternalLink size={10} className="opacity-60 group-hover/link:translate-x-0.5 transition-transform" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-300 italic font-medium px-1">Empty Structural Slot</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* COLUMN 3: GLOBAL ROW OPERATION CONTROL (ONLY RENDERS ON THE LAST ITEM TO SAVE HEIGHT) */}
                                                <td className="px-8 py-5 align-middle text-right">
                                                    {index === 0 && (
                                                        <div className="row-span-6">
                                                            {isEditingSocials ? (
                                                                <button
                                                                    disabled={saving}
                                                                    onClick={() => handleUpdateRecord("socials")}
                                                                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#c4a174] text-[#2b2652] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2b2652] hover:text-white transition active:scale-95 shadow-md shadow-[#c4a174]/20"
                                                                >
                                                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Matrix
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setIsEditingSocials(true)}
                                                                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#2b2652] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c4a174] hover:text-[#2b2652] transition active:scale-95 shadow-md"
                                                                >
                                                                    <Edit3 size={12} /> Mod Matrix
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SECURITY SYSTEM LOG FOOTER */}
                <div className="flex items-center justify-between opacity-30 mt-16 px-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Config Security Root 01</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Bangalore Collective Console</p>
                </div>

            </div>
        </div>
    );
}