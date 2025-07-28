import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Database, 
  Zap, 
  Shield, 
  Palette, 
  Plug, 
  Globe,
  CheckCircle,
  ArrowRight,
  Github,
  BookOpen
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Code,
      title: "WordPress Compatible APIs",
      description: "All REST API endpoints match WordPress specifications exactly, ensuring seamless migration and compatibility."
    },
    {
      icon: Database,
      title: "WordPress Database Schema",
      description: "Identical database structure and operations to WordPress, supporting all your existing data."
    },
    {
      icon: Zap,
      title: "Modern JavaScript Stack",
      description: "Built with Node.js, React, and TypeScript for superior performance and developer experience."
    },
    {
      icon: Shield,
      title: "Hook System",
      description: "WordPress-compatible actions and filters implemented in JavaScript for maximum extensibility."
    },
    {
      icon: Palette,
      title: "Multi-Renderer Themes",
      description: "Support for Next.js, React, and custom rendering engines in a single theme system."
    },
    {
      icon: Plug,
      title: "Plugin Architecture",
      description: "Extensible plugin system with WordPress-compatible hooks and activation patterns."
    }
  ];

  const techStack = [
    { name: "Node.js", color: "bg-green-500" },
    { name: "React", color: "bg-blue-500" },
    { name: "PostgreSQL", color: "bg-blue-600" },
    { name: "Express", color: "bg-gray-700" },
    { name: "TypeScript", color: "bg-blue-700" },
    { name: "Tailwind", color: "bg-cyan-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-wp-gray-light to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-wp-gray">NextPress</h1>
              <Badge className="bg-wp-blue text-white">v1.0.0</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-gray-300">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
              <Button variant="outline" className="border-gray-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </Button>
              <a href="/api/login">
                <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
                  Login to Admin
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-wp-blue/10 text-wp-blue border-wp-blue/20 mb-4">
              WordPress-Compatible CMS
            </Badge>
            <h1 className="text-5xl font-bold text-wp-gray mb-6">
              WordPress, Reimagined
              <br />
              <span className="text-wp-blue">in JavaScript</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              NextPress is a complete WordPress clone built with modern JavaScript technologies. 
              All WordPress APIs, hooks, and database operations are preserved, giving you the 
              power of WordPress with the performance of Node.js.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <a href="/api/login">
              <Button size="lg" className="bg-wp-blue hover:bg-wp-blue-dark text-white px-8 py-3">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-gray-300 px-8 py-3">
              <Globe className="w-5 h-5 mr-2" />
              View Demo Site
            </Button>
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <span className="text-sm text-gray-500 mr-4">Built with:</span>
            {techStack.map((tech, index) => (
              <Badge key={index} className={`${tech.color} text-white`}>
                {tech.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-wp-gray mb-4">
              Everything WordPress, Nothing Compromised
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              NextPress maintains 100% compatibility with WordPress while delivering 
              modern performance and developer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border border-gray-200 hover:border-wp-blue/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-wp-blue/10 rounded-lg">
                        <Icon className="w-6 h-6 text-wp-blue" />
                      </div>
                      <h3 className="text-lg font-semibold text-wp-gray">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compatibility Section */}
      <section className="py-20 bg-wp-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-wp-gray mb-4">
              WordPress Compatibility Guaranteed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              NextPress implements the exact same APIs, database schema, and hook system as WordPress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "REST API Endpoints", status: "100% Compatible" },
              { label: "Database Schema", status: "Identical" },
              { label: "Hook System", status: "Complete" },
              { label: "Theme Support", status: "Enhanced" },
              { label: "Plugin Architecture", status: "Compatible" },
              { label: "User Roles", status: "WordPress Standard" },
              { label: "Content Types", status: "Full Support" },
              { label: "Media Handling", status: "WordPress Compatible" }
            ].map((item, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium text-wp-gray mb-1">{item.label}</h4>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {item.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-wp-gray mb-6">
                Modern Performance,
                <br />
                <span className="text-wp-blue">WordPress Familiarity</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get the best of both worlds: the familiar WordPress interface and workflow 
                you know, powered by modern JavaScript for superior performance and scalability.
              </p>
              
              <div className="space-y-4">
                {[
                  "Node.js runtime for faster execution",
                  "React-based admin interface",
                  "TypeScript support for better development",
                  "Modern build tools and hot reloading",
                  "Enhanced security with modern practices"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-wp-gray-light rounded-lg p-8">
              <h3 className="text-xl font-semibold text-wp-gray mb-6">Performance Metrics</h3>
              <div className="space-y-4">
                {[
                  { metric: "Page Load Time", value: "~2x faster", improvement: "vs WordPress" },
                  { metric: "Admin Interface", value: "~3x faster", improvement: "React-powered" },
                  { metric: "API Response", value: "~4x faster", improvement: "Node.js runtime" },
                  { metric: "Development", value: "Hot reload", improvement: "Modern tooling" }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">{stat.metric}</span>
                    <div className="text-right">
                      <div className="font-semibold text-wp-blue">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.improvement}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-wp-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience NextPress?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start building with the WordPress-compatible CMS that brings modern performance 
            to the content management system you already know and love.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="/api/login">
              <Button size="lg" className="bg-white text-wp-blue hover:bg-gray-100 px-8 py-3">
                Access Admin Panel
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-wp-gray text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">NextPress</h3>
              <p className="text-gray-300 text-sm">
                WordPress-compatible CMS built with modern JavaScript technologies.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>WordPress API Compatible</li>
                <li>Modern Theme Engine</li>
                <li>Hook System</li>
                <li>Plugin Architecture</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Theme Development</li>
                <li>Plugin Development</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>GitHub</li>
                <li>Discord</li>
                <li>Forum</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-300">
            <p>&copy; 2025 NextPress. WordPress-compatible CMS powered by JavaScript.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
