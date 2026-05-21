import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { AppBootstrap } from '@/components/templates/DashboardLayout/AppBootstrap'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <AppBootstrap />
      {children}
    </DashboardLayout>
  )
}
