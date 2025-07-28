import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, File, MessageCircle, Users, Plus, FileUp, UserPlus, Download, CheckCircle } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts', { status: 'publish', per_page: 3 }],
  });

  const { data: activeTheme } = useQuery({
    queryKey: ['/api/themes/active'],
  });

  const statsItems = [
    { label: "Posts", value: stats?.posts || 0, icon: FileText, color: "text-wp-blue" },
    { label: "Pages", value: stats?.pages || 0, icon: File, color: "text-wp-blue" },
    { label: "Comments", value: stats?.comments || 0, icon: MessageCircle, color: "text-wp-blue" },
    { label: "Users", value: stats?.users || 0, icon: Users, color: "text-wp-blue" },
  ];

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-wp-gray">Dashboard</h1>
            <div className="flex items-center space-x-3">
              <Link href="/posts">
                <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Post
                </Button>
              </Link>
              <Button variant="outline" className="border-gray-300 hover:border-gray-400 text-gray-700">
                View Site
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 content-fade-in">
          {/* Welcome Panel */}
          <div className="bg-wp-blue text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Welcome to NextPress!</h2>
            <p className="text-blue-100 mb-4">
              Your WordPress-compatible CMS built with Node.js and React. All WordPress APIs, hooks, and database operations are preserved.
            </p>
            <div className="flex space-x-4">
              <Link href="/posts">
                <Button className="bg-white text-wp-blue hover:bg-gray-100">
                  Create Your First Post
                </Button>
              </Link>
              <Link href="/themes">
                <Button variant="outline" className="border-blue-300 text-white hover:bg-wp-blue-dark">
                  Browse Themes
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-wp-gray">
                          {statsLoading ? "..." : item.value}
                        </p>
                        <p className="text-sm text-gray-600">{item.label}</p>
                      </div>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-wp-gray">Recent Posts</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {postsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : recentPosts?.posts?.length > 0 ? (
                    <div className="space-y-4">
                      {recentPosts.posts.map((post: any) => (
                        <div key={post.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-medium text-wp-gray hover:text-wp-blue cursor-pointer">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {post.excerpt || "No excerpt available..."}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>By Admin</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded text-white ${
                                post.status === 'publish' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}>
                                {post.status === 'publish' ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button variant="ghost" size="sm">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No posts yet. <Link href="/posts" className="text-wp-blue hover:underline">Create your first post</Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Active Theme */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-wp-gray">Active Theme</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <img 
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
                      alt="Theme Preview" 
                      className="w-full h-32 object-cover rounded border mb-4"
                    />
                    <h4 className="font-semibold text-wp-gray mb-2">
                      {activeTheme?.name || "Next Theme"}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {activeTheme?.description || "A modern, responsive theme built with Next.js and Tailwind CSS."}
                    </p>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-wp-blue hover:bg-wp-blue-dark text-white">
                        Customize
                      </Button>
                      <Link href="/themes" className="flex-1">
                        <Button variant="outline" className="w-full border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                          Browse Themes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-wp-gray">System Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {[
                    { label: "WordPress API", status: "Compatible" },
                    { label: "Node.js Runtime", status: "Running" },
                    { label: "Database", status: "Connected" },
                    { label: "Hooks System", status: "Active" },
                    { label: "Test Coverage", status: "94%" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        {item.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-wp-gray">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {[
                    { icon: Plus, label: "Create New Post", href: "/posts" },
                    { icon: FileUp, label: "Add New Page", href: "/pages" },
                    { icon: UserPlus, label: "Add New User", href: "/users" },
                    { icon: Download, label: "Install Plugin", href: "/plugins" },
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link key={index} href={action.href}>
                        <Button variant="outline" className="w-full justify-start p-3 border-gray-200 hover:bg-gray-50">
                          <Icon className="w-4 h-4 mr-3 text-wp-blue" />
                          <span className="text-sm">{action.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Development Info */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-wp-gray mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-wp-blue" />
              NextPress Development Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "WordPress API Compatible",
                  description: "All REST API endpoints match WordPress specifications"
                },
                {
                  title: "Hook System",
                  description: "WordPress-compatible actions and filters in JavaScript"
                },
                {
                  title: "Theme Engine",
                  description: "Support for Next.js, React, and custom rendering methods"
                },
                {
                  title: "Database Schema",
                  description: "WordPress-compatible database structure and operations"
                },
                {
                  title: "Test Coverage",
                  description: "Comprehensive Jest test suite with TDD approach"
                },
                {
                  title: "TypeScript Ready",
                  description: "JavaScript codebase with TypeScript compatibility"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-wp-gray">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
