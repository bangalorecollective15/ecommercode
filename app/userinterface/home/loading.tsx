export default function HomeLoading() {
  return (
    <div className="w-full bg-[#fcfcfc] dark:bg-black min-h-screen animate-pulse">
      {/* 1. Hero Skeleton */}
      <div className="w-full h-[550px] md:h-[700px] bg-slate-200 dark:bg-slate-900 relative overflow-hidden flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full space-y-4">
          <div className="h-6 w-32 bg-slate-300 dark:bg-slate-800 rounded-full" />
          <div className="h-12 md:h-16 w-3/4 max-w-xl bg-slate-300 dark:bg-slate-800 rounded-xl" />
          <div className="h-5 w-1/2 max-w-md bg-slate-300 dark:bg-slate-800 rounded-lg" />
          <div className="h-12 w-40 bg-slate-300 dark:bg-slate-800 rounded-full mt-4" />
        </div>
      </div>

      {/* 2. Categories Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-900 rounded-lg mb-8 mx-auto" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-200 dark:bg-slate-900" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-900 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Product Spotlight Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-56 bg-slate-200 dark:bg-slate-900 rounded-lg mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-900 rounded-2xl" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-900 rounded" />
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-900 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
