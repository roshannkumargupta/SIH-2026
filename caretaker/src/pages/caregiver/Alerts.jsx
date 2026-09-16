import { DashboardLayout } from '../../layouts/DashboardLayout'
import { AlertCard } from '../../components/caregiver/AlertCard'
import { mockAlerts } from '../../mockData'

export default function Alerts() {
  const unreadCount = mockAlerts.filter((a) => !a.read).length

  return (
    <DashboardLayout title="Alerts & Notifications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">Alerts & Notifications</h1>
            <p className="text-sm text-ink/60 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts reviewed'}
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {mockAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}