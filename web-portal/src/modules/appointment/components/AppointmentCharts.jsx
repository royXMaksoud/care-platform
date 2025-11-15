import React from 'react'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

/**
 * Status Distribution Pie Chart
 * Shows breakdown of appointments by status (COMPLETED, CANCELLED, NO_SHOW, etc.)
 */
export function StatusDistributionChart({ data, isLoading }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || Object.keys(data).length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
  }

  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  const COLORS = {
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
    NO_SHOW: '#f59e0b',
    REQUESTED: '#3b82f6',
    CONFIRMED: '#8b5cf6',
    TRANSFERRED: '#06b6d4',
    RESCHEDULED: '#ec4899',
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} appointments`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Service Type Bar Chart
 * Shows top service types by appointment count
 */
export function ServiceTypeChart({ data, isLoading }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || Object.keys(data).length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
  }

  const chartData = Object.entries(data)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 service types

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" name="Appointments" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Trend Line Chart
 * Shows appointment trends over time
 */
export function TrendChart({ data, isLoading, period = 'DAILY' }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No trend data available</div>
  }

  const chartData = data.map((point) => ({
    date: point.dateLabel,
    total: point.totalAppointments,
    completed: point.completed,
    cancelled: point.cancelled,
    noShow: point.noShow,
  }))

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Total" />
          <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" name="Completed" />
          <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ef4444" fill="#ef4444" name="Cancelled" />
          <Area type="monotone" dataKey="noShow" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="No-Show" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Age Distribution Histogram
 */
export function AgeDistributionChart({ data, isLoading }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || Object.keys(data).length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No age data available</div>
  }

  // Order age groups logically
  const ageOrder = ['0-5', '6-15', '16-25', '26-35', '36-45', '46+', 'Unknown']
  const chartData = ageOrder
    .map((age) => ({
      ageGroup: age,
      count: data[age] || 0,
    }))
    .filter((item) => item.count > 0)

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ageGroup" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Gender Distribution Donut Chart
 */
export function GenderDistributionChart({ data, isLoading }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || Object.keys(data).length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No gender data available</div>
  }

  const chartData = Object.entries(data).map(([gender, count]) => ({
    name: gender,
    value: count,
  }))

  const COLORS = {
    Male: '#3b82f6',
    Female: '#ec4899',
    Other: '#8b5cf6',
    Unknown: '#9ca3af',
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            innerRadius={60}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} beneficiaries`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Priority Distribution Chart
 */
export function PriorityDistributionChart({ data, isLoading }) {
  if (isLoading) return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />

  if (!data || Object.keys(data).length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-500">No priority data available</div>
  }

  const chartData = Object.entries(data).map(([priority, count]) => ({
    name: priority,
    value: count,
  }))

  const COLORS = {
    URGENT: '#ef4444',
    NORMAL: '#10b981',
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
