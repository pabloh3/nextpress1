import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  FileText, 
  File, 
  Image, 
  MessageCircle, 
  Paintbrush, 
  Settings, 
  Plug, 
  Users, 
  Cog 
} from "lucide-react";

interface MenuItem {
  label: string;
  path: string;
  icon: any;
  section?: string;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/admin", icon: Gauge },
  { label: "Posts", path: "/admin/posts", icon: FileText, section: "Content" },
  { label: "Pages", path: "/admin/pages", icon: File, section: "Content" },
  { label: "Media", path: "/admin/media", icon: Image, section: "Content" },
  { label: "Comments", path: "/admin/comments", icon: MessageCircle, section: "Content" },
  { label: "Themes", path: "/admin/themes", icon: Paintbrush, section: "Appearance" },
  { label: "Customize", path: "/admin/customize", icon: Settings, section: "Appearance" },
  { label: "Plugins", path: "/admin/plugins", icon: Plug, section: "System" },
  { label: "Users", path: "/admin/users", icon: Users, section: "System" },
  { label: "Settings", path: "/admin/settings", icon: Cog, section: "System" },
];

export default function AdminSidebar() {
  const [location] = useLocation();

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!item.section) {
      acc.main = acc.main || [];
      acc.main.push(item);
    } else {
      acc[item.section] = acc[item.section] || [];
      acc[item.section].push(item);
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="fixed left-0 top-8 bottom-0 w-40 bg-wp-gray text-white overflow-y-auto z-40">
      <div className="p-4">
        <h1 className="text-lg font-bold text-white mb-4">NextPress</h1>
      </div>
      
      <nav className="space-y-1">
        {/* Main items (no section) */}
        {groupedItems.main?.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={`sidebar-hover flex items-center px-4 py-2 text-sm ${
                isActive ? 'bg-wp-blue-dark' : 'hover:bg-gray-700'
              }`}>
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </a>
            </Link>
          );
        })}
        
        {/* Sectioned items */}
        {Object.entries(groupedItems).filter(([key]) => key !== 'main').map(([section, items]) => (
          <div key={section} className="px-4 py-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{section}</div>
            <div className="space-y-1 ml-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <a className={`sidebar-hover flex items-center py-1 text-sm ${
                      isActive ? 'text-wp-blue-light' : 'hover:text-wp-blue-light'
                    }`}>
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
