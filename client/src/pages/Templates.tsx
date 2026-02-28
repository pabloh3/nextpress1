import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { Layout } from "lucide-react";

/**
 * Placeholder page for Templates. Functionality not yet supported; shows coming-soon banner.
 */
export default function Templates() {
  return (
    <div className="min-h-screen bg-wp-gray-light">
      <AdminTopBar />
      <AdminSidebar />

      <div className="ml-40 pt-8">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-wp-gray">Templates</h1>
        </div>

        <div className="p-6">
          <div
            className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
            role="status"
            aria-live="polite"
          >
            <Layout className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="font-medium">Templates functionality is coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
