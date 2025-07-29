import { useQuery } from "@tanstack/react-query";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import HomepageTemplate from "@/components/templates/HomepageTemplate";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: templateData } = useQuery({
    queryKey: ['/api/templates'],
    select: (data) => data?.templates?.find((t: any) => t.type === 'homepage' && t.isDefault),
  });

  // Use template if available, otherwise fall back to direct component
  if (templateData) {
    return (
      <div className="min-h-screen bg-wp-gray-light">
        <AdminTopBar />
        <AdminSidebar />
        <div className="ml-40 pt-8">
          <TemplateRenderer template={templateData} />
        </div>
      </div>
    );
  }

  // Fallback to direct homepage template with default config
  const defaultConfig = {
    header: {
      title: `Welcome back, ${user?.firstName || user?.username || "User"}!`,
      subtitle: "Here's what's happening with your NextPress site today.",
      showButtons: true,
      backgroundColor: "bg-white"
    },
    sections: [
      {
        id: "stats",
        type: "stats" as const,
        title: "Quick Stats",
        config: { showTrends: true }
      },
      {
        id: "overview",
        type: "cards" as const,
        title: "Site Overview",
        config: { layout: "grid" }
      },
      {
        id: "recent-content",
        type: "content" as const,
        title: "Recent Content",
        config: { limit: 5 }
      }
    ],
    footer: {
      showLinks: true,
      text: "NextPress - WordPress-compatible CMS"
    },
    styling: {
      backgroundColor: "bg-wp-gray-light",
      textColor: "text-wp-gray",
      accentColor: "text-wp-blue"
    }
  };

  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />
      <div className="ml-40 pt-8">
        <HomepageTemplate config={defaultConfig} />
      </div>
    </div>
  );
}