import React from "react";
import { Sprout, Bell, Menu, CheckCircle2, Trash2 } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onNewAssessment?: () => void;
  activeConversationTitle?: string;
  onClearHistoryCascade?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
  onNewAssessment,
  activeConversationTitle,
  onClearHistoryCascade,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/80 bg-white/70 backdrop-blur-md rounded-t-2xl sm:rounded-t-3xl transition-all z-20">
      {/* Left: Hamburger + Brand & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label={
              sidebarOpen ? "Hide assessment menu" : "Show assessment menu"
            }
            title={sidebarOpen ? "Hide menu" : "Show assessment history"}
            className={`p-2 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer ${
              sidebarOpen
                ? "bg-[#1F6F5F]/10 text-[#1F6F5F] ring-1 ring-[#1F6F5F]/20"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onNewAssessment}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FA084] rounded-lg"
          title="Return to new assessment"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1F6F5F] to-[#2FA084] flex items-center justify-center text-white shadow-sm shadow-[#1F6F5F]/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-[#6FCF97]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 tracking-tight text-sm">
                AgriCredit AI
              </span>
            </div>
            <p className="text-xs text-stone-500 font-normal leading-tight">
              AI Credit Assistant
            </p>
          </div>
        </button>

        {activeConversationTitle && (
          <div className="hidden lg:flex items-center gap-2 pl-4 ml-3 border-l border-stone-200 text-xs text-stone-600">
            <span className="text-stone-400">Current Assessment:</span>
            <span className="font-medium text-stone-800 truncate max-w-xs">
              {activeConversationTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions, Notifications & Credit Officer Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100/80 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FA084]"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2FA084] rounded-full ring-2 ring-white" />
        </button>

        <div className="h-5 w-px bg-stone-200" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1F6F5F] to-[#2FA084] text-white flex items-center justify-center font-medium text-xs shadow-xs">
              EO
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-2xs">
              <div className="w-2 h-2 bg-[#2FA084] rounded-full" />
            </div>
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-stone-800 leading-tight flex items-center gap-1">
              Credit Officer
              <CheckCircle2 className="w-3 h-3 text-[#2FA084]" />
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Commercial Ag Lending
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
