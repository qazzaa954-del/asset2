'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Package,
  Building2,
  FileText,
  Wrench,
  Users,
  BarChart3,
  LogOut,
  TrendingDown,
  FolderKanban,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Master Admin', 'Engineering', 'IT', 'User'] },
  { href: '/assets', label: 'Master Inventory', icon: Package, roles: ['Master Admin', 'Engineering', 'IT', 'User'] },
  { href: '/asset-projects', label: 'Asset Projects', icon: FolderKanban, roles: ['Master Admin', 'Engineering', 'IT', 'User'] },
  { href: '/departments', label: 'Master Departemen', icon: Building2, roles: ['Master Admin'] },
  { href: '/financial', label: 'Finansial & Audit', icon: FileText, roles: ['Master Admin'] },
  { href: '/depreciation', label: 'Depresiasi', icon: TrendingDown, roles: ['Master Admin'] },
  { href: '/work-orders', label: 'Work Order', icon: Wrench, roles: ['Master Admin', 'Engineering', 'IT', 'User'] },
  { href: '/users', label: 'Manajemen Pengguna', icon: Users, roles: ['Master Admin'] },
  { href: '/reports', label: 'Laporan BAK', icon: BarChart3, roles: ['Master Admin', 'Engineering', 'IT', 'User'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { userProfile, signOut } = useAuth()
  const [departmentPermissions, setDepartmentPermissions] = useState<Set<string>>(new Set())

  // Fetch department permissions
  useEffect(() => {
    if (!userProfile || !userProfile.department_id) return

    const isMasterAdmin = userProfile.role?.trim() === 'Master Admin'
    
    // Master Admin always has access to all menus
    if (isMasterAdmin) {
      setDepartmentPermissions(new Set(menuItems.map(m => m.href)))
      return
    }

    // Fetch permissions for user's department
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('department_menu_permissions')
          .select('menu_path, is_allowed')
          .eq('department_id', userProfile.department_id)
          .eq('is_allowed', true)

        if (error) {
          console.error('Error fetching permissions:', error)
          // Fallback to role-based access if permissions not found
          return
        }

        const allowedPaths = new Set((data || []).map(p => p.menu_path))
        setDepartmentPermissions(allowedPaths)
      } catch (error) {
        console.error('Error in fetchPermissions:', error)
      }
    }

    fetchPermissions()
  }, [userProfile])

  // Show all menu items if userProfile is null (for development/testing)
  // Otherwise filter by role and permissions
  const filteredMenuItems = userProfile
    ? menuItems.filter((item) => {
        const isMasterAdmin = userProfile.role?.trim() === 'Master Admin'
        
        // Master Admin always has access
        if (isMasterAdmin) {
          return true
        }

        // Special case: Asset Projects is always visible to authenticated users
        if (item.href === '/asset-projects') {
          return true
        }

        // Check department permissions
        if (userProfile.department_id && departmentPermissions.size > 0) {
          return departmentPermissions.has(item.href)
        }

        // Fallback to role-based access if permissions not loaded yet
        const userRole = userProfile.role?.trim().toLowerCase()
        const matches = item.roles.some(role => role.trim().toLowerCase() === userRole)
        
        return matches
      })
    : menuItems // Show all menus if no userProfile (for testing)

  return (
    <div className="w-64 bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Logo */}
        <div className="p-6 border-b border-green-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <Logo size="sm" showText={false} />
            <h1 className="text-xl font-bold text-white drop-shadow-lg">
              Asset-Damar-Langit
            </h1>
          </div>
          {userProfile && (
            <p className="text-sm text-green-200 mt-1 opacity-90">
              {userProfile.full_name} ({userProfile.role})
            </p>
          )}
        </div>

        {/* Logout Button - Moved closer to header */}
        <div className="px-4 pt-4 pb-2">
          <Button
            variant="outline"
            className="w-full justify-start text-white border-green-700/50 hover:bg-green-700/30 hover:border-green-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 group"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-[-4px] transition-transform duration-300" />
            Keluar
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative',
                      isActive
                        ? 'bg-green-700 text-white shadow-lg shadow-green-900/50'
                        : 'text-green-100 hover:bg-green-800/50 hover:text-white'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                    )}
                    <Icon className={cn(
                      'w-5 h-5 transition-transform duration-300',
                      isActive ? 'text-white' : 'text-green-200 group-hover:text-white group-hover:scale-110'
                    )} />
                    <span className={cn(
                      'font-medium',
                      isActive ? 'text-white' : 'text-green-100 group-hover:text-white'
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
