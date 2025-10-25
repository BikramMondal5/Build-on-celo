import { Button } from "@/components/ui/button";
import { StatsSection } from "@/components/stats-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Search, QrCode, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-white via-forest/3 to-forest/8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 overflow-hidden flex items-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-20 left-20 w-64 h-64 bg-forest/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-32 w-96 h-96 bg-forest/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-forest/5 via-transparent to-forest/10 rounded-full blur-3xl"></div>
        </div>



        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-8 animate-fade-in">
              <span className="inline-flex items-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-forest dark:text-forest-light text-sm font-semibold rounded-full shadow-lg border border-forest/20 dark:border-forest-light/20">
                Student Food Claiming System
              </span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                Claim Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-forest via-forest-dark to-forest bg-clip-text text-transparent">
                Campus Meals
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Transform campus dining with our innovative digital platform. 
              <span className="font-semibold text-forest dark:text-forest-light"> Reduce waste, save money, </span>
              and enjoy fresh meals with just a claim code.
            </p>
            
                                    {/* Learn More and Login Buttons */}
            <div className="flex justify-center items-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Button 
                className="group relative bg-gradient-to-r from-forest to-forest-dark hover:from-forest-dark hover:to-forest text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-forest/25 transition-all duration-300 hover:scale-105 border-0"
                onClick={() => window.location.href = '/login'}
              >
                <span className="relative flex items-center">
                  Login
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Button>
              
              <Button 
                variant="outline"
                className="group relative border-2 border-forest text-forest hover:bg-forest hover:text-white px-8 py-3 text-base font-medium rounded-xl shadow-lg hover:shadow-forest/25 transition-all duration-300 hover:scale-105"
                onClick={() => {
                  const featuresSection = document.getElementById('features-section');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span className="relative flex items-center">
                  Learn More
                  
                </span>
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-600 dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">Real-time Availability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">Claim Code Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">Instant Notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why RePlate? / Problem & Impact Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-full">
                🧩 Why RePlate?
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-red-600 to-gray-900 dark:from-white dark:via-red-400 dark:to-white bg-clip-text text-transparent mb-6">
              The Food Waste Crisis
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Every year, campuses throw away thousands of fresh meals due to excess production. 
              RePlate transforms this waste into value — giving students affordable meals and reducing carbon footprint at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Food Waste Stats */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📉</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Food Waste Stats</h3>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">40%</div>
                  <p className="text-gray-600 dark:text-gray-300">of campus food goes to waste</p>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">2,500+</div>
                  <p className="text-gray-600 dark:text-gray-300">meals wasted daily on average campus</p>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Environmental Impact</h3>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">75%</div>
                  <p className="text-gray-600 dark:text-gray-300">reduction in CO₂ emissions</p>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">1,200+</div>
                  <p className="text-gray-600 dark:text-gray-300">meals saved monthly with RePlate</p>
                </div>
              </div>
            </div>

            {/* Before & After Comparison */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Before & After</h3>
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Before RePlate</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Fresh meals thrown away, students pay full price, massive waste</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">With RePlate</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Meals claimed by students, reduced waste, affordable dining</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section id="features-section" className="relative bg-gradient-to-br from-white via-forest/2 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-40 h-40 bg-forest/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-56 h-56 bg-forest/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full">
                Simple & Effective
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-forest to-gray-900 dark:from-white dark:via-forest-light dark:to-white bg-clip-text text-transparent mb-6">
              How RePlate Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Simple steps to reduce food waste and save money on campus meals through our innovative platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                number: "01",
                title: "Browse Available Meals",
                description: "Discover discounted meals from campus canteens with real-time availability updates and detailed nutritional information for smart dining choices.",
                icon: Search,
                bgColor: "bg-forest/10",
                iconColor: "text-forest"
              },
              {
                number: "02", 
                title: "Claim Your Meal",
                description: "Easily secure your meal with a unique claim code that grants you access within a convenient 2-hour pickup window, ensuring your food stays fresh.",
                icon: QrCode,
                bgColor: "bg-forest/10",
                iconColor: "text-forest"
              },
              {
                number: "03",
                title: "Show & Collect", 
                description: "Show your claim code at the canteen to collect your discounted meal, helping reduce food waste on campus while enjoying great food at lower prices.",
                icon: CheckCircle,
                bgColor: "bg-forest/10",
                iconColor: "text-forest"
              }
            ].map((step, index) => (
              <div key={index} className="group relative">
                
                
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    {/* Number badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-forest to-forest-dark rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-2xl font-bold">{step.number}</span>
                      </div>
                      <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`${step.iconColor} w-8 h-8`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-forest dark:group-hover:text-forest-light transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="mt-8 w-0 group-hover:w-full h-1 bg-gradient-to-r from-forest to-forest-dark rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA section */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <span>Ready to start saving meals and money?</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Benefits Section */}
      <section className="relative bg-gradient-to-br from-forest/5 via-white to-forest/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-40 h-40 bg-forest/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-56 h-56 bg-forest/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full">
                🌱 What Sets Us Apart
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-forest to-gray-900 dark:from-white dark:via-forest-light dark:to-white bg-clip-text text-transparent mb-6">
              Key Features & Benefits
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover what makes RePlate the leading solution for campus food waste reduction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "⚡",
                title: "Real-time Meal Listings",
                description: "Get instant updates on available meals with live inventory tracking and smart notifications.",
                color: "from-yellow-500 to-orange-500",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/10"
              },
              {
                icon: "🔒",
                title: "Secure Claim Codes",
                description: "Advanced encryption ensures your meal claims are safe and tamper-proof with unique QR codes.",
                color: "from-blue-500 to-indigo-500",
                bgColor: "bg-blue-50 dark:bg-blue-900/10"
              },
              {
                icon: "🌍",
                title: "Sustainability Tracking",
                description: "Monitor your environmental impact with detailed analytics on waste reduction and carbon savings.",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50 dark:bg-green-900/10"
              },
              {
                icon: "📲",
                title: "Instant QR Pickup",
                description: "Seamless pickup experience with one-tap QR scanning and instant meal collection verification.",
                color: "from-purple-500 to-pink-500",
                bgColor: "bg-purple-50 dark:bg-purple-900/10"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                  
                  <div className="relative z-10 text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl">{feature.icon}</span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-forest dark:group-hover:text-forest-light transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      {feature.description}
                    </p>

                    {/* Bottom accent line */}
                    <div className={`mt-6 w-0 group-hover:w-full h-1 bg-gradient-to-r ${feature.color} rounded-full transition-all duration-500 mx-auto`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-32 h-32 bg-forest/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-forest/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full">
                💬 What People Say
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-forest to-gray-900 dark:from-white dark:via-forest-light dark:to-white bg-clip-text text-transparent mb-6">
              Trusted by Students & Canteens
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              See what our community says about RePlate's impact on campus dining
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Student Testimonial */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-forest to-forest-dark rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Chen</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Computer Science Student</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "RePlate has been a game-changer! I've saved over $200 this semester while helping reduce food waste. The app is so easy to use and the meals are always fresh."
              </p>
              <div className="flex text-yellow-400 mt-4">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            {/* Canteen Manager Testimonial */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Mike Rodriguez</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Campus Dining Manager</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "We've reduced our food waste by 60% since implementing RePlate. Students love the discounted meals and we're saving money on disposal costs. Win-win!"
              </p>
              <div className="flex text-yellow-400 mt-4">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            {/* Partner Logo */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-forest to-forest-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">U</span>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">University of Tech</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Pilot Partner</p>
                <div className="text-xs text-forest dark:text-forest-light font-medium">
                  "Supported by Campus XYZ"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Movement CTA Footer */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-12">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 rounded-2xl opacity-20 blur-sm"></div>
            
            <div className="relative text-center">
              <div className="mb-8">
                <span className="inline-block px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
                  🌎 Join the Movement
                </span>
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  Be Part of the Zero-Waste Revolution
                </h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
                  Join RePlate today — for students, canteens, and change-makers. 
                  Together, we can create a sustainable future for campus dining.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                  onClick={() => window.location.href = '/login'}
                >
                  Get Started Today
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                  onClick={() => {
                    const featuresSection = document.getElementById('features-section');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
