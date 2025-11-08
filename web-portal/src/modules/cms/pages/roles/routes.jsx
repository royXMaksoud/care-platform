import React from 'react'
import SystemRolesList from './SystemRolesList'
import SystemRoleDetails from './SystemRoleDetails'

export const rolesRoutes = [
  {
    path: '/cms/roles',
    element: <SystemRolesList />,
  },
  {
    path: '/cms/roles/:roleId',
    element: <SystemRoleDetails />,
  },
]
