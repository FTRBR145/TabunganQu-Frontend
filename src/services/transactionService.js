import api from './api'

export const transactionService = {
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.month) params.append('month', filters.month)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    const response = await api.get(`/transactions?${params.toString()}`)
    return response.data
  },

  createTransaction: async (data) => {
    const response = await api.post('/transactions', data)
    return response.data
  },

  updateTransaction: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data)
    return response.data
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`)
    return response.data
  },

  getSummary: async (month = null) => {
    const url = month ? `/transactions/summary?month=${month}` : '/transactions/summary'
    const response = await api.get(url)
    return response.data
  },

  getChartData: async (year = null) => {
    const url = year ? `/transactions/chart?year=${year}` : '/transactions/chart'
    const response = await api.get(url)
    return response.data
  }
}