import { useAuth } from "@/hooks/useAuth";

export default function AdminTopBar() {
  const { user } = useAuth();

  return (
    <div className="wp-admin-bar fixed top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="text-white text-sm font-semibold">NextPress</div>
        <div className="text-gray-300 text-xs">WordPress-Compatible CMS</div>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-gray-300 text-xs">
          Hello, <span>{user?.firstName || user?.username || "Admin"}</span>
        </span>
        <a href="/api/logout" className="text-gray-300 hover:text-white text-xs">
          Log Out
        </a>
      </div>
    </div>
  );
}
