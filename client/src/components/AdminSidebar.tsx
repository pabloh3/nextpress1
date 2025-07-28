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
  Link as LinkIcon, 
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
  { label: "Dashboard", path: "/", icon: Gauge },
  { label: "Posts", path: "/posts", icon: FileText, section: "Content" },
  { label: "Pages", path: "/pages", icon: File, section: "Content" },
  { label: "Media", path: "/media", icon: Image, section: "Content" },
  { label: "Comments", path: "/comments", icon: MessageCircle, section: "Content" },
  { label: "Themes", path: "/themes", icon: Paintbrush, section: "Appearance" },
  { label: "Customize", path: "/customize", icon: Settings, section: "Appearance" },
  { label: "Plugins", path: "/plugins", icon: Plug, section: "System" },
  { label: "Hooks System", path: "/hooks", icon: LinkIcon, section: "System" },
  { label: "Users", path: "/users", icon: Users, section: "System" },
  { label: "Settings", path: "/settings", icon: Cog, section: "System" },
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
