import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Globe, Database, Code, Shield, Bell } from "lucide-react";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OptionFormData {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  enableComments: boolean;
  moderateComments: boolean;
  enableRegistration: boolean;
  defaultRole: string;
}

export default function Settings() {
  const [formData, setFormData] = useState<OptionFormData>({
    siteName: "NextPress Site",
    siteDescription: "WordPress-Compatible CMS",
    siteUrl: "",
    adminEmail: "",
    timezone: "UTC",
    dateFormat: "F j, Y",
    timeFormat: "g:i a",
    enableComments: true,
    moderateComments: true,
    enableRegistration: false,
    defaultRole: "subscriber"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/options'],
    enabled: false // We'll implement this when we have multiple options endpoint
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OptionFormData>) => {
      // Save each setting as a separate option
      const promises = Object.entries(data).map(([key, value]) =>
        apiRequest('POST', '/api/options', { name: key, value: String(value) })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/options'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const systemInfo = [
    { label: "NextPress Version", value: "1.0.0" },
    { label: "Node.js Version", value: process.env.NODE_VERSION || "18.x" },
    { label: "Database", value: "PostgreSQL" },
    { label: "WordPress API", value: "Compatible" },
    { label: "Hook System", value: "Active" },
    { label: "Theme Engine", value: "Multi-Renderer" }
  ];

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      
      <div className="ml-40 pt-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-wp-gray">Settings</h1>
            <Button 
              className="bg-wp-blue hover:bg-wp-blue-dark text-white"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="writing">Writing</TabsTrigger>
              <TabsTrigger value="reading">Reading</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-wp-blue" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Title</Label>
                      <Input
                        id="siteName"
                        value={formData.siteName}
                        onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                        placeholder="Your site title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={formData.siteDescription}
                      onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                      placeholder="Brief description of your site"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">Site URL</Label>
                    <Input
                      id="siteUrl"
                      value={formData.siteUrl}
                      onChange={(e) => setFormData({...formData, siteUrl: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                        placeholder="UTC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Input
                        id="dateFormat"
                        value={formData.dateFormat}
                        onChange={(e) => setFormData({...formData, dateFormat: e.target.value})}
                        placeholder="F j, Y"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Input
                        id="timeFormat"
                        value={formData.timeFormat}
                        onChange={(e) => setFormData({...formData, timeFormat: e.target.value})}
                        placeholder="g:i a"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Writing Settings */}
            <TabsContent value="writing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="w-5 h-5 mr-2 text-wp-blue" />
                    Writing Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Rich Text Editor</Label>
                        <p className="text-sm text-gray-600">Use visual editor for posts and pages</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-save Posts</Label>
                        <p className="text-sm text-gray-600">Automatically save drafts while writing</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Code Syntax Highlighting</Label>
                        <p className="text-sm text-gray-600">Highlight code blocks in posts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reading Settings */}
            <TabsContent value="reading">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Posts per Page</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <Label>RSS Feed Posts</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable RSS Feeds</Label>
                        <p className="text-sm text-gray-600">Allow RSS feed generation</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Search Engine Visibility</Label>
                        <p className="text-sm text-gray-600">Discourage search engines from indexing this site</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discussion Settings */}
            <TabsContent value="discussion">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-wp-blue" />
                    Discussion Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Comments</Label>
                        <p className="text-sm text-gray-600">Enable comments on posts and pages</p>
                      </div>
                      <Switch 
                        checked={formData.enableComments}
                        onCheckedChange={(checked) => setFormData({...formData, enableComments: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Moderate Comments</Label>
                        <p className="text-sm text-gray-600">Comments must be approved before appearing</p>
                      </div>
                      <Switch 
                        checked={formData.moderateComments}
                        onCheckedChange={(checked) => setFormData({...formData, moderateComments: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">Send email when new comments are posted</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>User Registration</Label>
                        <p className="text-sm text-gray-600">Allow new user registration</p>
                      </div>
                      <Switch 
                        checked={formData.enableRegistration}
                        onCheckedChange={(checked) => setFormData({...formData, enableRegistration: checked})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default User Role</Label>
                      <Input
                        value={formData.defaultRole}
                        onChange={(e) => setFormData({...formData, defaultRole: e.target.value})}
                        placeholder="subscriber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system">
              <div className="space-y-6">
                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="w-5 h-5 mr-2 text-wp-blue" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {systemInfo.map((info, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">{info.label}</span>
                          <Badge variant="outline">{info.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-wp-blue" />
                      Performance & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Caching</Label>
                        <p className="text-sm text-gray-600">Cache rendered pages for better performance</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Compression</Label>
                        <p className="text-sm text-gray-600">Compress responses to reduce bandwidth</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Security Headers</Label>
                        <p className="text-sm text-gray-600">Add security headers to responses</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Debug Mode</Label>
                        <p className="text-sm text-gray-600">Enable debug logging and error details</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* API Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>REST API</Label>
                        <p className="text-sm text-gray-600">Enable WordPress-compatible REST API</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>GraphQL API</Label>
                        <p className="text-sm text-gray-600">Enable GraphQL endpoint for modern applications</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Webhooks</Label>
                        <p className="text-sm text-gray-600">Enable webhook notifications for content changes</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
