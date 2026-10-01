import React from 'react'

const ActionButton = ({ icon, count }: { icon: React.ReactNode; count: number }) => (
  <button
    type='button'
    className='w-full flex items-center justify-center gap-1 rounded px-1.5 py-2 font-semibold text-gray-900 hover:bg-gray-50'
  >
    {icon}
    {count}
  </button>
)

export default ActionButton