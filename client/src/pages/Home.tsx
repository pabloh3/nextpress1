import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Settings,
  Plus
} from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentPosts } = useQuery({
    queryKey: ['/api/posts', { status: 'publish', per_page: 5 }],
  });

  const { data: recentComments } = useQuery({
    queryKey: ['/api/comments', { status: 'approved', per_page: 5 }],
  });

  const activityItems = [
    {
      type: "post",
      title: "New post published",
      description: "Building NextPress: A WordPress Alternative",
      time: "2 hours ago",
      icon: FileText,
      color: "text-wp-blue"
    },
    {
      type: "comment",
      title: "New comment received",
      description: "Great article! Thanks for sharing...",
      time: "4 hours ago",
      icon: MessageCircle,
      color: "text-green-500"
    },
    {
      type: "user",
      title: "User registered",
      description: "new.user@example.com joined",
      time: "1 day ago",
      icon: Users,
      color: "text-purple-500"
    }
  ];

  const quickStats = [
    {
      label: "Total Views",
      value: "12,345",
      change: "+12%",
      changeType: "positive",
      icon: Eye
    },
    {
      label: "Total Likes",
      value: "1,234",
      change: "+8%",
      changeType: "positive",
      icon: Heart
    },
    {
      label: "Total Shares",
      value: "567",
      change: "+15%",
      changeType: "positive",
      icon: Share2
    },
    {
      label: "Avg. Time",
      value: "3m 45s",
      change: "+5%",
      changeType: "positive",
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-wp-gray">
                Welcome back, {user?.firstName || user?.username || "User"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your NextPress site today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/admin/posts">
                <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border border-gray-200 hover:border-wp-blue/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-wp-gray">{stat.value}</p>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-500">{stat.change}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-wp-blue/10 rounded-lg">
                        <Icon className="w-5 h-5 text-wp-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Content Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Site Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Site Overview
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      All Systems Operational
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-wp-blue mb-2">
                        {stats?.posts || 0}
                      </div>
                      <div className="text-sm text-gray-600">Published Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-wp-blue mb-2">
                        {stats?.pages || 0}
                      </div>
                      <div className="text-sm text-gray-600">Published Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-wp-blue mb-2">
                        {stats?.comments || 0}
                      </div>
                      <div className="text-sm text-gray-600">Approved Comments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPosts?.posts?.length > 0 ? (
                    <div className="space-y-4">
                      {recentPosts.posts.slice(0, 3).map((post: any) => (
                        <div key={post.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:border-wp-blue/30 transition-colors">
                          <div className="p-2 bg-wp-blue/10 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-wp-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-wp-gray truncate">{post.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {post.excerpt || "No excerpt available..."}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              <Badge variant={post.status === 'publish' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No posts yet.</p>
                      <Link href="/admin/posts">
                        <Button variant="link" className="text-wp-blue">
                          Create your first post
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Activity & Quick Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: FileText, label: "Write a Post", href: "/admin/posts", color: "text-wp-blue" },
                    { icon: FileText, label: "Create a Page", href: "/admin/pages", color: "text-green-500" },
                    { icon: MessageCircle, label: "Moderate Comments", href: "/admin/comments", color: "text-yellow-500" },
                    { icon: Users, label: "Manage Users", href: "/admin/users", color: "text-purple-500" }
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link key={index} href={action.href}>
                        <Button variant="outline" className="w-full justify-start p-3 hover:border-wp-blue/30">
                          <Icon className={`w-4 h-4 mr-3 ${action.color}`} />
                          {action.label}
                        </Button>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="p-1.5 bg-gray-100 rounded-full flex-shrink-0">
                            <Icon className={`w-3 h-3 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-wp-gray">{item.title}</p>
                            <p className="text-xs text-gray-600 truncate">{item.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Site Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Site Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "WordPress API", status: "Active", color: "text-green-500" },
                    { label: "Database", status: "Connected", color: "text-green-500" },
                    { label: "Hooks System", status: "Running", color: "text-green-500" },
                    { label: "Cache", status: "Enabled", color: "text-green-500" }
                  ].map((health, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{health.label}</span>
                      <Badge variant="outline" className={`${health.color} border-current`}>
                        {health.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* NextPress Info */}
          <Card className="bg-gradient-to-r from-wp-blue/5 to-wp-blue-light/5 border-wp-blue/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-wp-blue/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-wp-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-wp-gray mb-2">
                    NextPress is Running Smoothly
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your WordPress-compatible CMS is performing optimally. All systems are operational 
                    and your content is being served efficiently with modern JavaScript performance.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-wp-blue text-white">Node.js Runtime</Badge>
                    <Badge className="bg-green-500 text-white">Database Connected</Badge>
                    <Badge className="bg-purple-500 text-white">Hooks Active</Badge>
                    <Badge className="bg-orange-500 text-white">Themes Ready</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
