
import { useState } from "react";
import { 
  LayoutDashboard, 
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

interface ReviewerSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const ReviewerSidebar = ({ activeView, onViewChange }: ReviewerSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assigned", label: "Assigned", icon: Clock },
    { id: "selected", label: "Selected", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
  ];

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleMobile}>
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Reviewer Portal</h2>
          </div>
          
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onViewChange(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        activeView === item.id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section with password change */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Password change dialog */}
      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        reviewerId={currentUser.id}
      />
    </>
  );
};
