import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          Cehpoint Client Insight Engine
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Transform your LinkedIn prospect data into actionable insights with AI-powered analysis
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-400">
            Upload your Excel or CSV file containing prospect data, and our AI will:
          </p>
          <ul className="text-left space-y-2 text-gray-700 dark:text-gray-400 max-w-md mx-auto">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Identify ideal clients for your services
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Generate three tailored pitch suggestions per prospect
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              Create personalized conversation starters
            </li>
          </ul>
        </div>
        
        <Link 
          href="/upload"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Get Started
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Powered by Google Gemini AI
        </p>
      </div>
    </div>
  );
}
