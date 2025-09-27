export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Navigation Header */}
      <nav className="border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-sm font-bold text-white">ST</span>
              </div>
              <div>
                <h1 className="text-primary text-xl font-bold">SafeTracker</h1>
                <p className="text-xs text-gray-500">Health, Safety & Wellbeing</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden items-center space-x-8 md:flex">
              <a href="#features" className="hover:text-primary text-gray-700 transition-colors">
                Features
              </a>
              <a href="#about" className="hover:text-primary text-gray-700 transition-colors">
                About
              </a>
              <a href="#contact" className="hover:text-primary text-gray-700 transition-colors">
                Contact
              </a>
              <a
                href="/login"
                className="bg-secondary text-on-secondary hover:bg-secondary/90 rounded-md px-4 py-2 font-medium transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="from-primary to-primary/80 bg-gradient-to-br text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-block rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium">Employee Safety Management</span>
            </div>

            {/* Main Title */}
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">SafeTracker</h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-3xl text-xl text-white/90 md:text-2xl">
              Comprehensive training management system for workplace safety and compliance. Track, monitor, and ensure
              your team's safety training requirements.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/login"
                className="bg-secondary text-on-secondary hover:bg-secondary/90 rounded-lg px-8 py-4 text-lg font-semibold transition-colors"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="hover:text-primary rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Streamline your safety training management with our comprehensive platform
            </p>
          </div>

          {/* Process Steps */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Upload Training Data</h3>
              <p className="text-gray-600">
                Import training records from Excel files or connect to your existing LMS/TryBooking systems
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-xl font-bold text-white">2</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Track Progress</h3>
              <p className="text-gray-600">
                Monitor employee training completion rates and compliance status in real-time
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-xl font-bold text-white">3</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Generate Reports</h3>
              <p className="text-gray-600">
                Create comprehensive compliance reports and analytics for management review
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-300">
                <span className="text-xl font-bold text-gray-600">4</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Stay Compliant</h3>
              <p className="text-gray-600">
                Ensure your organization meets all safety training requirements and regulations
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-primary rounded-lg border-l-4 bg-gray-50 p-8">
              <div className="bg-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="font-bold text-white">👥</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Employee Management</h3>
              <p className="text-gray-600">
                Centralized employee database with training history, certifications, and compliance tracking.
              </p>
            </div>

            <div className="border-secondary rounded-lg border-l-4 bg-gray-50 p-8">
              <div className="bg-secondary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <span className="text-on-secondary font-bold">📊</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Analytics & Reporting</h3>
              <p className="text-gray-600">
                Comprehensive analytics dashboard with real-time insights and automated compliance reports.
              </p>
            </div>

            <div className="rounded-lg border-l-4 border-green-500 bg-gray-50 p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                <span className="font-bold text-white">🔔</span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Smart Notifications</h3>
              <p className="text-gray-600">
                Automated reminders for upcoming training deadlines and compliance requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about SafeTracker</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">What types of training can I track?</h3>
              <p className="text-gray-600">
                Safe Track supports all types of workplace safety training including workplace safety, first aid, fire
                safety, emergency procedures, and custom training programs. You can import data from Excel files or
                connect to existing LMS systems.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">How does the compliance reporting work?</h3>
              <p className="text-gray-600">
                Our system automatically generates compliance reports based on your training data. You can view
                completion rates, identify gaps, and export reports for management review or regulatory compliance.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Can I integrate with existing systems?</h3>
              <p className="text-gray-600">
                Yes! Safe Track can connect to your existing LMS, TryBooking, or other training management systems
                through our API integration. We also support bulk data import from Excel and CSV files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-4xl font-bold">Ready to improve your safety training management?</h2>
          <p className="mb-8 text-xl text-white/90">
            Join organizations that trust SafeTracker to manage their workplace safety and compliance requirements.
          </p>
          <a
            href="/login"
            className="bg-secondary text-on-secondary hover:bg-secondary/90 inline-block rounded-lg px-8 py-4 text-lg font-semibold transition-colors"
          >
            Get Started Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center space-x-3">
                <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-on-secondary text-sm font-bold">ST</span>
                </div>
                <h3 className="text-xl font-bold">SafeTracker</h3>
              </div>
              <p className="mb-4 text-gray-400">
                Comprehensive training management system for workplace safety and compliance.
              </p>
              <p className="text-sm text-gray-500">Copyright © 2025 CITS5206 Group 1 - All rights reserved</p>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Team Members</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Christina Fington</li>
                <li>Zhaodong Shen</li>
                <li>Wei Dai</li>
                <li>Dani Thomas</li>
                <li>Siqi Shen</li>
                <li>Gayathri Kanakaratne</li>
                <li>Manas Rawat</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="/login" className="transition-colors hover:text-white">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#features" className="transition-colors hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#about" className="transition-colors hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="transition-colors hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
