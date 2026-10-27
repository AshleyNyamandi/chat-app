// NotFound.jsx
import { useNavigate, useLocation } from 'react-router';

function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear
    -to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-10 text-center shadow-2xl border border-slate-900/5 dark:border-white/5 animate-fade-up">
        {/* Icon */}
        <div className="w-18 h-18 mx-auto mb-6 flex items-center justify-center rounded-full bg-linear
        -to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 text-amber-600 dark:text-amber-400">
          <svg
            className="w-9 h-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M11 8v3" />
            <path d="M11 14h.01" />
          </svg>
        </div>

        {/* Code */}
        <p className="text-xs font-bold tracking-[0.15em] text-amber-600 dark:text-amber-400 mb-2">
          404
        </p>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
          Page Not Found
        </h1>

        {/* Message */}
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
          We couldn't find the page you're looking for.
        </p>

        {/* Show the broken path */}
        <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-8 break-all">
          {location.pathname}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-transparent text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;