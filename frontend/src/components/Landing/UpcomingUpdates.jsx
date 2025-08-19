import React from "react";

function UpcomingUpdates() {
  const plannedUpdates = [
    {
      feature: "Resources Hub",
      description:
        "Access a comprehensive library of educational resources, tutorials, and study materials curated by the community.",
      expectedRelease: "Q3 2025",
      icon: "�", // Books icon
    },
    {
      feature: "Contact Admin System",
      description:
        "Direct communication channel with administrators for support, feedback, and platform-related inquiries.",
      expectedRelease: "Q3 2025",
      icon: "📞", // Phone icon
    },
    {
      feature: "Collaboration Platform",
      description:
        "Connect and collaborate with peers on projects, find study partners, and create team-based learning experiences.",
      expectedRelease: "Q4 2025",
      icon: "🤝", // Handshake icon
    },
    {
      feature: "Enhanced Star-popularity System",
      description:
        "Advanced rating system with detailed analytics to track your contributions and community impact over time.",
      expectedRelease: "Q4 2025",
      icon: "⭐", // Star icon
    },
    {
      feature: "Real-time Notifications",
      description:
        "Stay updated with instant notifications for comments, likes, collaboration requests, and admin announcements.",
      expectedRelease: "Q1 2026",
      icon: "🔔", // Bell icon
    },
    {
      feature: "Mobile Application",
      description:
        "Native mobile app for iOS and Android with full feature parity and optimized user experience.",
      expectedRelease: "Q2 2026",
      icon: "📱", // Mobile phone icon
    },
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background decorative elements */}
        <div
          className="absolute top-[15%] right-[20%] w-64 h-64 bg-orange-800/20 rounded-tr-[50%] rounded-bl-[50%] animate-pulse blur-xl"
          style={{ animationDuration: "4s" }}
        ></div>

        <div
          className="absolute bottom-[10%] left-[15%] w-72 h-72 rounded-full bg-blue-400/20 animate-bounce blur-md"
          style={{ animationDuration: "10s" }}
        ></div>

        <div
          className="absolute top-[40%] right-[8%] w-64 h-64 bg-purple-500/20 rounded-tr-[50%] rounded-bl-[50%] animate-spin blur-xl"
          style={{ animationDuration: "15s" }}
        ></div>

        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-Saira font-bold text-gray-900 mb-4">
            Upcoming Updates
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-Jost">
            Exciting new features and improvements are on the way. Here's what we're working on to enhance your SitVerse experience.
          </p>
        </div>

        {/* Updates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plannedUpdates.map((update, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-2 border border-gray-100"
            >
              <div className="p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{update.icon}</span>
                </div>
                
                <h3 className="text-xl font-Saira font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {update.feature}
                </h3>
                
                <p className="text-gray-600 font-Jost leading-relaxed mb-4 text-sm">
                  {update.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {update.expectedRelease}
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-full font-Jost font-semibold text-lg hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
            <span>Stay Tuned for Updates</span>
            <span className="text-xl">🚀</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpcomingUpdates;
