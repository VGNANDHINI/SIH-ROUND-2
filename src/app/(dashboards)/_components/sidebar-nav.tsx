// src/app/(dashboards)/_components/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  Droplet, Home, MessageSquare, Power, Layers, Users, 
  Bell, FlaskConical, Map, Clock, ClipboardCheck, 
  AlertCircle, Wrench, Search, BookOpen, FilePenLine,
  Camera, BarChart, HelpCircle, CheckSquare,
  Presentation, ShieldCheck, User, Sparkles
} from "lucide-react";
import React from "react";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

// Enhanced navigation items with better visual hierarchy
const navItems = {
  "gram-panchayat": [
    { 
      href: "/gram-panchayat", 
      labelKey: "sidebar_gp_dashboard", 
      icon: <Home className="w-5 h-5" />, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "मुख्य पृष्ठ"
    },
    { 
      href: "/gram-panchayat/complaints", 
      labelKey: "sidebar_gp_complaints", 
      icon: <MessageSquare className="w-5 h-5" />, 
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "शिकायतें"
    },
    { 
      href: "/gram-panchayat/pump-control", 
      labelKey: "sidebar_gp_pump_control", 
      icon: <Power className="w-5 h-5" />, 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "पंप"
    },
    { 
      href: "/gram-panchayat/tank-levels", 
      labelKey: "sidebar_gp_tank_levels", 
      icon: <Layers className="w-5 h-5" />, 
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      description: "टैंक"
    },
    { 
      href: "/gram-panchayat/operator-management", 
      labelKey: "sidebar_gp_operator_management", 
      icon: <Users className="w-5 h-5" />, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "कर्मचारी"
    },
    { 
      href: "/gram-panchayat/alerts", 
      labelKey: "sidebar_gp_alerts", 
      icon: <Bell className="w-5 h-5" />, 
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "सूचना"
    },
    { 
      href: "/gram-panchayat/water-quality", 
      labelKey: "sidebar_gp_water_quality", 
      icon: <FlaskConical className="w-5 h-5" />, 
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      description: "गुणवत्ता"
    },
    { 
      href: "/gram-panchayat/gis-atlas", 
      labelKey: "sidebar_gp_gis_atlas", 
      icon: <Map className="w-5 h-5" />, 
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "नक्शा"
    },
  ],
  "pump-operator": [
    { 
      href: "/pump-operator", 
      labelKey: "sidebar_po_dashboard", 
      icon: <Home className="w-5 h-5" />, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "घर"
    },
    { 
      href: "/pump-operator/supply-schedule", 
      labelKey: "sidebar_po_supply_schedule", 
      icon: <Clock className="w-5 h-5" />, 
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "समय"
    },
    { 
      href: "/pump-operator/checklist", 
      labelKey: "sidebar_po_checklist", 
      icon: <ClipboardCheck className="w-5 h-5" />, 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "जांच"
    },
    { 
      href: "/pump-operator/pump-status", 
      labelKey: "sidebar_po_pump_status", 
      icon: <Power className="w-5 h-5" />, 
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "पंप"
    },
    { 
      href: "/pump-operator/report", 
      labelKey: "sidebar_po_report_issue", 
      icon: <AlertCircle className="w-5 h-5" />, 
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "रिपोर्ट"
    },
    { 
      href: "/pump-operator/maintenance", 
      labelKey: "sidebar_po_maintenance", 
      icon: <Wrench className="w-5 h-5" />, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "मरम्मत"
    },
    { 
      href: "/pump-operator/leakage-detection", 
      labelKey: "sidebar_po_leakage_detection", 
      icon: <Search className="w-5 h-5" />, 
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      description: "रिसाव"
    },
    { 
      href: "/pump-operator/sop-library", 
      labelKey: "sidebar_po_sop_library", 
      icon: <BookOpen className="w-5 h-5" />, 
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "सीखें"
    },
    { 
      href: "/pump-operator/water-quality", 
      labelKey: "sidebar_po_water_quality", 
      icon: <FlaskConical className="w-5 h-5" />, 
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      description: "गुणवत्ता"
    },
  ],
  "village-resident": [
    { 
      href: "/village-resident", 
      labelKey: "sidebar_vr_dashboard", 
      icon: <Home className="w-5 h-5" />, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "घर"
    },
    { 
      href: "/village-resident/availability", 
      labelKey: "sidebar_vr_availability", 
      icon: <Droplet className="w-5 h-5" />, 
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      description: "पानी?"
    },
    { 
      href: "/village-resident/complaints", 
      labelKey: "sidebar_vr_complaints", 
      icon: <FilePenLine className="w-5 h-5" />, 
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "शिकायत"
    },
    { 
      href: "/village-resident/water-quality", 
      labelKey: "sidebar_vr_water_quality", 
      icon: <FlaskConical className="w-5 h-5" />, 
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      description: "शुद्ध?"
    },
    { 
      href: "/village-resident/report", 
      labelKey: "sidebar_vr_report", 
      icon: <BarChart className="w-5 h-5" />, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "रिपोर्ट"
    },
    { 
      href: "/village-resident/help", 
      labelKey: "sidebar_vr_help", 
      icon: <HelpCircle className="w-5 h-5" />, 
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "सहायता"
    },
  ],
  "block-official": [
    { 
      href: "/block-official", 
      labelKey: "sidebar_bo_dashboard", 
      icon: <Home className="w-5 h-5" />, 
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "घर"
    },
    { 
      href: "/block-official/approvals", 
      labelKey: "sidebar_bo_approvals", 
      icon: <CheckSquare className="w-5 h-5" />, 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "स्वीकृति"
    },
    { 
      href: "/block-official/analytics", 
      labelKey: "sidebar_bo_analytics", 
      icon: <Presentation className="w-5 h-5" />, 
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "विश्लेषण"
    },
    { 
      href: "/block-official/work-verification", 
      labelKey: "sidebar_bo_work_verification", 
      icon: <ShieldCheck className="w-5 h-5" />, 
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "सत्यापन"
    },
    { 
      href: "/block-official/water-quality", 
      labelKey: "sidebar_bo_water_quality", 
      icon: <FlaskConical className="w-5 h-5" />, 
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      description: "गुणवत्ता"
    },
  ],
};

type Role = keyof typeof navItems;

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const role = pathname.split("/")[1] as Role;
  const currentNavItems = navItems[role] || [];
  
  const getSubPath = (path: string, depth: number) => {
    return "/" + path.split("/").slice(1, depth + 1).join("/");
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg font-headline">JalShakthi</span>
            <p className="text-xs text-muted-foreground">जलशक्ति</p>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarMenu>
          {currentNavItems.map((item) => {
            const isActive = getSubPath(pathname, 2) === item.href;
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  size="lg"
                  className={cn(
                    "group relative h-auto p-2 justify-start",
                    isActive && `${item.bgColor} border-l-4 ${item.color.replace('text-','border-')}`
                  )}
                  tooltip={{
                    children: (
                      <div>
                        <div className="font-bold">{t(item.labelKey)}</div>
                        <div className="text-muted-foreground">{item.description}</div>
                      </div>
                    ),
                    className: "p-2"
                  }}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                      isActive ? item.bgColor : "bg-gray-100 dark:bg-gray-800 group-hover:bg-sidebar-accent",
                      item.color
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium truncate">
                        {t(item.labelKey)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              size="lg"
              isActive={pathname.endsWith('/profile')}
              className="group h-auto p-2 justify-start"
              tooltip={{children: "User Profile"}}
            >
              <Link href={`/${role}/profile`} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-sidebar-accent transition-colors">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-medium truncate">
                    {t('sidebar_user_profile')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    प्रोफ़ाइल
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
