
"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const roleTitleKeys: { [key: string]: string } = {
  "gram-panchayat": "header_role_gp",
  "pump-operator": "header_role_po",
  "village-resident": "header_role_vr",
  "block-official": "header_role_bo",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();

  const segments = pathname.split('/');
  const role = segments[1];
  
  const titleKey = roleTitleKeys[role] || "header_dashboard";
  let title = t(titleKey);

  if(segments[2]) {
    const subPage = segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
    title = `${title.split(' Dashboard')[0]} - ${subPage}`;
  }
  
  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };
  
  const getInitials = (email?: string | null) => {
    if (!email) return role ? role.charAt(0).toUpperCase() : 'U';
    return email.charAt(0).toUpperCase();
  }


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-semibold font-headline">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ""} />}
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('header_logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
