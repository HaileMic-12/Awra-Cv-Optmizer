import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-200">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:opacity-90 transition-opacity">
          AWRA
        </Link>
        <div className="flex gap-4 items-center">
          <Link 
            href="/login" 
            className="text-gray-600 font-bold hover:text-indigo-600 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="bg-gray-900 text-white font-bold px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 max-w-4xl leading-tight mb-6">
          Stop getting ghosted by <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 drop-shadow-sm">
            job boards.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed font-medium">
          Stop sending your resume into the void. AWRA instantly tailors your CV to beat the filters, drafts cover letters that recruiters actually want to read, and tracks every application in one place. <span className="text-gray-900 font-bold">Less applying, more interviewing.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link 
            href="/signup" 
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.5)] hover:-translate-y-1 transition-all active:scale-95"
          >
            Try it out for free
          </Link>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="bg-white py-24 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          
          {/* Feature 1 */}
          <div className="space-y-4 p-6 rounded-3xl hover:bg-gray-50 transition-colors">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Tailor your resume</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              You know you're qualified, but the automated filters don't. We reorganize your existing experience to highlight the exact keywords the company is looking for.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-4 p-6 rounded-3xl hover:bg-gray-50 transition-colors">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Better cover letters</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              No more staring at a blank page. Drop in the job link, and we'll help you draft a cover letter that explains why you're actually a great fit for the role.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-4 p-6 rounded-3xl hover:bg-gray-50 transition-colors">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-purple-100">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Organize the hunt</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Ditch the messy Excel spreadsheets. Save the jobs you want, move them across a simple board when you apply, and know exactly when you need to follow up.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}