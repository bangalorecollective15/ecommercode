"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Volume2,
  VolumeX,
  Loader2,
  Eye,
  Share2,
  X,
  ArrowLeft,
  Grid,
  Lock,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VideoPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authentication & Auth Modal States
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Video Settings
  const [popupMuted, setPopupMuted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [feedMuted, setFeedMuted] = useState(true);

  // Mobile Navigation State: null = grid view, number = active full-screen reel index
  const [activeMobileReel, setActiveMobileReel] = useState<number | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const viewedVideosRef = useRef<Set<number>>(new Set());
  const router = useRouter();

  // 1. Device Check
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. MASSIVE SPEED BOOST: Parallel Fetching
  useEffect(() => {
    async function initPageData() {
      try {
        setLoading(true);

        // Fetch BOTH queries at the exact same time instead of waiting
        const [
          { data: infoData },
          { data: videoData, error: videoError }
        ] = await Promise.all([
          supabase.from("site_info").select("*").eq("id", 1).single(),
          supabase.from("videos")
            .select(`
              *,
              products (id, name, description, product_images (image_url), product_variations (price)),
              video_likes!left (id, user_id)
            `)
            .order("created_at", { ascending: false })
        ]);

        if (infoData) setSiteInfo(infoData);
        if (videoError) throw videoError;

        const formattedVideos =
          videoData?.map((video: any) => ({
            ...video,
            likes_count: video.video_likes?.length || 0,
            liked_by_user: user
              ? video.video_likes?.some((like: any) => like.user_id === user.id)
              : false,
          })) || [];

        setVideos(formattedVideos);
      } catch (err: any) {
        console.error("Error loading application data:", err.message);
      } finally {
        setLoading(false);
      }
    }

    initPageData();
  }, [user]);

  // 4. Universal Safe Edge-Swipe/Mouse-Swipe Back Interceptor
  useEffect(() => {
    const handleParamSync = () => {
      const searchParams = new URLSearchParams(window.location.search);
      
      if (searchParams.get("view") !== "reels") {
        setActiveMobileReel(null);
      }

      if (searchParams.get("view") !== "popup") {
        setSelectedVideo(null);
        setPopupMuted(false);
      }
    };

    window.addEventListener("popstate", handleParamSync);
    return () => window.removeEventListener("popstate", handleParamSync);
  }, []);

  // 5. Views Metrics Analytics Logic
  useEffect(() => {
    let currentVideoId: any = null;
    let currentViews = 0;

    if (isDesktop) {
      if (!selectedVideo) return;
      currentVideoId = selectedVideo.id;
      currentViews = selectedVideo.views_count || 0;
    } else {
      if (
        activeMobileReel === null ||
        videos.length === 0 ||
        !videos[activeMobileReel]
      )
        return;

      currentVideoId = videos[activeMobileReel].id;
      currentViews = videos[activeMobileReel].views_count || 0;
    }

    if (!currentVideoId || viewedVideosRef.current.has(currentVideoId)) return;

    const timer = setTimeout(async () => {
      if (viewedVideosRef.current.has(currentVideoId)) return;

      viewedVideosRef.current.add(currentVideoId);

      const { error } = await supabase
        .from("videos")
        .update({ views_count: currentViews + 1 })
        .eq("id", currentVideoId);

      if (!error) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === currentVideoId ? { ...v, views_count: currentViews + 1 } : v
          )
        );

        if (isDesktop) {
          setSelectedVideo((prev: any) =>
            prev ? { ...prev, views_count: currentViews + 1 } : null
          );
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedVideo?.id, activeMobileReel, isDesktop, videos]);

  // 6. Feed Video Play/Pause Logic
  useEffect(() => {
    if (!videoRefs.current) return;

    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = feedMuted;

      if (isDesktop) {
        video.pause();
      } else {
        if (activeMobileReel !== null && index === activeMobileReel) {
          const playPromise = video.play();
          if (playPromise !== undefined) playPromise.catch(() => { });
        } else {
          video.pause();
        }
      }
    });
  }, [feedMuted, isDesktop, activeMobileReel]);

  // 7. Intersection Observer (Mobile tracker)
  useEffect(() => {
    if (isDesktop || activeMobileReel === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveMobileReel(index);
          }
        });
      },
      { threshold: [0.75] }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [videos, isDesktop, activeMobileReel]);

  // Auto-scroll layout handler
  useEffect(() => {
    if (!isDesktop && activeMobileReel !== null) {
      const timer = setTimeout(() => {
        sectionRefs.current[activeMobileReel]?.scrollIntoView({ behavior: "auto" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMobileReel, isDesktop]);

  const togglePopupMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopupMuted(!popupMuted);
  };

  const handleLike = async (e: React.MouseEvent, videoId: number, currentLikes: number) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const { data: existingLike, error: checkError } = await supabase
        .from("video_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

      if (checkError) throw checkError;

      let newLikesCount = currentLikes;

      if (existingLike) {
        await supabase.from("video_likes").delete().eq("id", existingLike.id);
        newLikesCount = Math.max(currentLikes - 1, 0);
      } else {
        await supabase.from("video_likes").insert({ user_id: user.id, video_id: videoId });
        newLikesCount = currentLikes + 1;
      }

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, likes_count: newLikesCount, liked_by_user: !existingLike } : v
        )
      );

      if (selectedVideo?.id === videoId) {
        setSelectedVideo((prev: any) =>
          prev ? { ...prev, likes_count: newLikesCount, liked_by_user: !existingLike } : null
        );
      }
    } catch (err: any) {
      console.error("Error executing like operation:", err.message);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  const toggleFeedMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFeedMuted(!feedMuted);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfcfc] dark:bg-black transition-colors duration-300">
        <Loader2 className="animate-spin text-[#E8C999] h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-black text-slate-900 dark:text-white selection:bg-orange-100 dark:selection:bg-slate-800 transition-colors duration-300">

      {/* PROFILE HEADER PANEL */}
      {(isDesktop || (!isDesktop && activeMobileReel === null)) && (
        <header className="max-w-4xl mx-auto pt-24 md:pt-28 pb-6 md:pb-10 px-6 md:px-8 border-b border-slate-200 dark:border-[#333] transition-colors duration-300">
          <div className="flex gap-6 md:gap-16 items-center">
            <div className="flex-shrink-0 relative">
              <div className="w-24 h-24 md:w-36 md:h-36">
                <img
                  src="/banglorelogo.jpeg"
                  className="w-full h-full object-contain"
                  alt="Profile Logo"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 md:space-y-3">
              <div className="text-sm md:text-base text-slate-600 dark:text-gray-300 font-normal transition-colors duration-300">
                <p className="font-semibold text-slate-900 dark:text-white text-xl md:text-2xl transition-colors duration-300">Bangalore Collective</p>
              </div>
              <div className="flex gap-6 mt-3 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white transition-colors duration-300">{videos.length}</span>
                  <span>posts</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-1 text-slate-400 dark:text-gray-400 transition-colors duration-300">
                {siteInfo?.instagram && (
                  <a href={siteInfo.instagram} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="Instagram">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                  </a>
                )}
                {siteInfo?.youtube && (
                  <a href={siteInfo.youtube} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="YouTube">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" /><polygon points="10 15 15 12 10 9" /></svg>
                  </a>
                )}
                {siteInfo?.snapchat && (
                  <a href={siteInfo.snapchat} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="Snapchat">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-3.1 0-5.5 2-5.5 5 0 1.2.4 2.5.8 3.3-.6.5-1.2 1-1.8 2.2 0 .6.5.9 1.5.9h.3c.4 1.3 1.3 2.1 3.2 2.6.4.4.9.9 1.5.9s1.1-.5 1.5-.9c1.9-.5 2.8-1.3 3.2-2.6h.3c1 0 1.5-.3 1.5-.9 0-1.2-.6-1.7-1.8-2.2.4-.8.8-2.1.8-3.3 0-3-2.4-5-5-5z" /></svg>
                  </a>
                )}
                {siteInfo?.facebook && (
                  <a href={siteInfo.facebook} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="Facebook">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  </a>
                )}
                {siteInfo?.whatsapp && (
                  <a href={siteInfo.whatsapp} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="WhatsApp">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
                {siteInfo?.google && (
                  <a href={siteInfo.google} target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors" title="Google">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c5.14 0 9.4-3.87 9.94-8.88H12v-3h9.8c.1.6.2 1.2.2 1.88z" /></svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {!isDesktop && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-3 border-t border-slate-200 dark:border-[#333] text-[#E8C999] transition-colors duration-300">
              <Grid size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Reels</span>
            </div>
          )}
        </header>
      )}

      {/* MOBILE PROFILE GRID (RESTORED VIDEO THUMBNAILS) */}
      {!isDesktop && activeMobileReel === null && (
        <main className="grid grid-cols-3 gap-0.5 p-0.5 bg-[#fcfcfc] dark:bg-black transition-colors duration-300">
          {videos.map((video, index) => (
            <div
              key={`grid-${video.id}`}
              onClick={() => {
                router.push(window.location.pathname + "?view=reels", { scroll: false });
                setActiveMobileReel(index);
              }}
              className="relative w-full aspect-square bg-slate-200 dark:bg-[#111] overflow-hidden active:scale-95 transition-transform cursor-pointer"
            >
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  className="absolute inset-0 w-full h-full object-cover block z-10" 
                  alt="Video thumbnail"
                  decoding="async" 
                />
              ) : (
                <video 
                  src={`${video.video_url}#t=0.1`} 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" 
                  preload="metadata" 
                  muted 
                  playsInline 
                />
              )}

              {video.products && (
                <div className="absolute top-1.5 right-1.5 bg-black/50 dark:bg-black/50 backdrop-blur-md p-1 rounded-md z-30 transition-colors duration-300">
                  <ShoppingBag size={11} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </main>
      )}

      {/* MAIN CONTENT PORTAL PANELS */}
      {(isDesktop || (!isDesktop && activeMobileReel !== null)) && (
        <main
          className={`${isDesktop
            ? "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8 mt-12"
            : "h-[100dvh] w-full bg-[#fcfcfc] dark:bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide fixed inset-0 z-50 overscroll-contain transition-colors duration-300"
            }`}
          {...(!isDesktop ? { onWheel: (e) => e.stopPropagation() } : {})}
        >
          {!isDesktop && activeMobileReel !== null && (
            <button
              onClick={(e) => { e.stopPropagation(); router.back(); }}
              className="fixed top-5 left-5 z-[60] bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-slate-200 dark:border-[#333]/50 text-slate-900 dark:text-white p-3 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-300"
            >
              <ArrowLeft size={22} />
              <span className="text-xs font-bold pl-1.5 pr-1">Profile</span>
            </button>
          )}

          {videos.map((video, index) => {
            if (!isDesktop && activeMobileReel !== index && Math.abs(activeMobileReel! - index) > 1) {
              return <section key={`placeholder-${video.id}`} className="h-[100dvh] w-full snap-start bg-[#fcfcfc] dark:bg-black transition-colors duration-300" />;
            }

            return (
              <section
                ref={(el) => { sectionRefs.current[index] = el; }}
                key={video.id}
                data-index={index}
                onClick={() => {
                  if (isDesktop) {
                    router.push(window.location.pathname + "?view=popup", { scroll: false });
                    setSelectedVideo(video);
                  }
                }}
                className={`relative group ${isDesktop
                  ? "w-full aspect-[9/16] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#333] cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.01] bg-slate-100 dark:bg-[#111]"
                  : "h-[100dvh] w-full snap-start overflow-hidden bg-black dark:bg-black select-none transition-colors duration-300"
                  }`}
              >
                
                {isDesktop ? (
                  video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      className="absolute inset-0 w-full h-full object-cover block z-10 bg-slate-100 dark:bg-[#111] transition-colors duration-300"
                      alt="Reel Cover"
                      decoding="async"
                      fetchPriority={index < 4 ? "high" : "auto"}
                    />
                  ) : (
                    <video
                      src={`${video.video_url}#t=0.1`}
                      className="absolute inset-0 w-full h-full object-cover z-10 bg-slate-100 dark:bg-[#111] transition-colors duration-300"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )
                ) : (
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={video.video_url}
                    poster={video.thumbnail_url || undefined}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    loop
                    muted={feedMuted}
                    playsInline
                    autoPlay={activeMobileReel === index}
                    preload={activeMobileReel === index ? "auto" : "none"}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 dark:from-black/90 via-black/10 dark:via-black/10 to-transparent pointer-events-none z-20 transition-colors duration-300" />
                {isDesktop && (
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none z-20" />
                )}

                {/* Mobile Controls Overlay Panel */}
                {!isDesktop && (
                  <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-30">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={toggleFeedMute} className="w-14 h-14 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white transition-colors duration-300">
                        {feedMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                      </button>
                      <span className="text-white text-xs font-bold">Audio</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={(e) => handleLike(e, video.id, video.likes_count || 0)} className="w-14 h-14 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white transition-colors duration-300">
                        <Heart size={28} className={video.liked_by_user ? "fill-red-500 text-red-500" : ""} />
                      </button>
                      <span className="text-white text-xs font-bold">{video.likes_count || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white transition-colors duration-300">
                        <Eye size={28} />
                      </div>
                      <span className="text-white text-xs font-bold">{video.views_count || 0}</span>
                    </div>
                    <button onClick={(e) => handleShare(e, video.title)} className="w-14 h-14 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white transition-colors duration-300">
                      <Share2 size={28} />
                    </button>
                  </div>
                )}

                {/* Bottom Card Layout Panel */}
                <div className="absolute bottom-0 left-0 w-full p-5 space-y-3.5 z-30">
                  {video.products && (
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => { e.stopPropagation(); router.push(`/userinterface/product/${video.products.id}`); }}
                      className="bg-black/40 dark:bg-[#111]/80 backdrop-blur-2xl border border-white/20 dark:border-[#333] rounded-xl p-2.5 flex items-center gap-3 cursor-pointer max-w-[260px] transition-colors duration-300"
                    >
                      <img src={video.products.product_images?.[0]?.image_url} className="w-11 h-11 rounded-md object-cover" alt="" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white text-xs font-bold truncate">{video.products.name}</p>
                        <p className="text-[#E8C999] text-xs font-black">₹ {video.products.product_variations?.[0]?.price}</p>
                      </div>
                      <ShoppingBag className="text-white" size={18} />
                    </motion.div>
                  )}

                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-black text-lg leading-tight truncate">{video.title}</h2>
                      {!isDesktop && <p className="text-white/70 text-sm line-clamp-2 mt-1">{video.description}</p>}
                    </div>
                    <a
                      href={`https://wa.me/919060889995?text=Enquiry: ${encodeURIComponent(video.title)}`}
                      target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      className="bg-[#25D366] p-2.5 rounded-xl text-white shadow-lg flex-shrink-0"
                    >
                      <img src="/whatsicon.png" className="w-5 h-5" alt="WA" />
                    </a>
                  </div>
                </div>
              </section>
            );
          })}
        </main>
      )}

      {/* Desktop Popup Detail Overlay */}
      <AnimatePresence>
        {isDesktop && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/95 backdrop-blur-md flex items-center justify-center transition-colors duration-300"
            onClick={() => router.back()}
          >
            <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="absolute top-8 right-8 text-slate-900 dark:text-white hover:scale-110 transition-transform z-50">
              <X size={36} />
            </button>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="relative h-[85vh] aspect-[9/16] bg-[#fcfcfc] dark:bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#333] transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={selectedVideo.video_url}
                poster={selectedVideo.thumbnail_url || undefined}
                autoPlay
                loop
                muted={popupMuted}
                playsInline
                className="h-full w-full object-cover absolute inset-0 z-10"
              />
              
              {/* Keep the gradient to make text readable over the popup video */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 dark:from-black/90 via-transparent to-transparent pointer-events-none z-20" />

              <button onClick={togglePopupMute} className="absolute top-5 left-4 z-50 bg-black/40 dark:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-colors duration-300">
                {popupMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-50">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={(e) => handleLike(e, selectedVideo.id, selectedVideo.likes_count || 0)} className="w-12 h-12 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white hover:bg-red-500/40 transition-colors duration-300">
                    <Heart size={24} className={selectedVideo.liked_by_user ? "fill-red-500 text-red-500" : ""} />
                  </button>
                  <span className="text-white text-xs font-bold">{selectedVideo.likes_count || 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-black/40 dark:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 dark:border-[#444] text-white transition-colors duration-300">
                    <Eye size={24} />
                  </div>
                  <span className="text-white text-xs font-bold">{selectedVideo.views_count || 0}</span>
                </div>
              </div>

              <div className="absolute bottom-5 left-5 right-5 z-50 space-y-4">
                {selectedVideo.products && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/userinterface/product/${selectedVideo.products.id}`)}
                    className="bg-black/50 dark:bg-[#222]/80 backdrop-blur-2xl border border-white/20 dark:border-[#444] rounded-xl p-3 flex items-center gap-3 cursor-pointer max-w-[260px] shadow-2xl transition-colors duration-300"
                  >
                    <img src={selectedVideo.products.product_images?.[0]?.image_url} className="w-12 h-12 rounded-lg object-cover border border-white/20 dark:border-[#444] flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{selectedVideo.products.name}</p>
                      <p className="text-[#E8C999] text-base font-black">₹ {selectedVideo.products.product_variations?.[0]?.price}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/20 dark:bg-black/40 flex items-center justify-center border border-white/20 dark:border-[#444] transition-colors duration-300">
                      <ShoppingBag size={16} className="text-white" />
                    </div>
                  </motion.div>
                )}

                <div>
                  <h2 className="text-white font-black text-xl leading-tight">{selectedVideo.title}</h2>
                  {selectedVideo.description && (
                    <p className="text-white/70 text-xs mt-1.5 line-clamp-2 max-w-sm">{selectedVideo.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC AUTHENTICATION CHALLENGE MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 transition-colors duration-300"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 dark:bg-[#111]/90 border border-slate-200 dark:border-[#333] rounded-2xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E8C999] via-slate-300 dark:via-[#333] to-[#E8C999] transition-colors duration-300" />
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300">
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#222] flex items-center justify-center border border-slate-200 dark:border-[#444] text-[#E8C999] mb-2 transition-colors duration-300"><Lock size={22} /></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Authentication Required</h3>
                <p className="text-slate-500 dark:text-gray-400 text-xs max-w-xs transition-colors duration-300">Please log in to your account to interact, like posts, and complete enquiries.</p>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 transition-colors duration-300">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-[#333] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#E8C999] transition-colors duration-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 transition-colors duration-300">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-[#333] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#E8C999] transition-colors duration-300" />
                </div>
                {authError && <div className="text-rose-500 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-lg font-medium">{authError}</div>}
                <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-sm py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-gray-200 active:scale-[0.99] transition flex items-center justify-center gap-2">
                  {authLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Sign In"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}