import { Sidebar } from '../components/common/Sidebar'
import { TopBar } from '../components/common/TopBar'
import { MobileHeader } from '../components/common/MobileHeader'
import { BottomNav } from '../components/common/BottomNav'

export function DashboardLayout({ children, title }) {
  return (
    <div className="flex h-screen bg-cream text-ink overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title={title} />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <TopBar title={title} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
          <div className="max-w-2xl md:max-w-4xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
