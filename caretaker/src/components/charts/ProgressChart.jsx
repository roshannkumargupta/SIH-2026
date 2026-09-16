import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function ProgressChart({ data }) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9CFBF" opacity={0.6} />
          <XAxis dataKey="date" stroke="#2B2419" fontSize={11} opacity={0.65} tickLine={false} />
          <YAxis stroke="#2B2419" fontSize={11} opacity={0.65} domain={[0, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#D9CFBF',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#2B2419',
              boxShadow: '0 4px 16px rgba(43, 36, 25, 0.1)',
            }}
            labelStyle={{ color: '#E87A3A', fontWeight: 'bold' }}
            formatter={(value) => [`${value}%`, 'Score']}
          />
          <Bar dataKey="overallScore" fill="#E87A3A" radius={[6, 6, 0, 0]} name="Overall" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
