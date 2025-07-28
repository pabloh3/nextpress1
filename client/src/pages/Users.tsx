import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Edit, Trash2, Mail } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";

export default function Users() {
  // Mock data for demonstration since user management is complex
  const users = [
    {
      id: "1",
      username: "admin",
      email: "admin@nextpress.com",
      firstName: "Admin",
      lastName: "User",
      role: "administrator",
      status: "active",
      profileImageUrl: null,
      createdAt: new Date().toISOString()
    }
  ];

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      administrator: "destructive",
      editor: "default",
      author: "secondary",
      contributor: "outline",
      subscriber: "outline"
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-wp-gray">Users</h1>
            <Button className="bg-wp-blue hover:bg-wp-blue-dark text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-wp-gray">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`mailto:${user.email}`}
                          className="text-wp-blue hover:underline flex items-center"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Roles Info */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-wp-gray mb-4">User Roles & Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  role: "Administrator",
                  description: "Full access to all NextPress features and settings",
                  capabilities: ["Manage posts", "Manage users", "Install themes", "Modify settings"]
                },
                {
                  role: "Editor",
                  description: "Can publish and manage posts including posts by other users",
                  capabilities: ["Publish posts", "Edit others' posts", "Manage comments", "Upload files"]
                },
                {
                  role: "Author",
                  description: "Can publish and manage their own posts",
                  capabilities: ["Publish own posts", "Edit own posts", "Upload files", "View comments"]
                },
                {
                  role: "Contributor",
                  description: "Can write and manage their own posts but cannot publish them",
                  capabilities: ["Write posts", "Edit own posts", "View own posts"]
                },
                {
                  role: "Subscriber",
                  description: "Can only manage their profile and view content",
                  capabilities: ["Read posts", "Edit profile", "View comments"]
                }
              ].map((role, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-wp-gray">{role.role}</h4>
                    {getRoleBadge(role.role.toLowerCase())}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div className="space-y-1">
                    {role.capabilities.map((capability, capIndex) => (
                      <div key={capIndex} className="text-xs text-gray-500 flex items-center">
                        <span className="w-1 h-1 bg-wp-blue rounded-full mr-2"></span>
                        {capability}
                      </div>
                    ))}
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
