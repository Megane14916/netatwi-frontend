import { Newspaper, PlusCircle, Settings } from "lucide-react";
import type { AdminTab } from "../hooks/useAdminDashboard";

const tabs = [
  { id: "create", label: "新規作成", icon: PlusCircle },
  { id: "manage", label: "大会管理", icon: Settings },
  { id: "news", label: "ニュース管理", icon: Newspaper },
] as const;

export function AdminTabs({ activeTab, onChange }: { activeTab: AdminTab; onChange: (tab: AdminTab) => void }) {
  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === id ? 'border-[#1DA1F2] text-[#1DA1F2]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-500'}`}
          >
            <Icon className="inline-block h-5 w-5 mr-1.5 align-text-bottom" /> {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
