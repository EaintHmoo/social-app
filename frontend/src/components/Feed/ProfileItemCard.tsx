import { BookmarkIcon, EyeIcon, GroupIcon, PersonStandingIcon } from 'lucide-react'
import React from 'react'

const ProfileItemCard = () => {
  return (
    <div className=' border border-gray-300 rounded-xl overflow-hidden bg-white p-4'>
      <div className='grid grid-cols-1 text-sm gap-2'>
        <a href='' className='flex gap-1 hover:text-indigo-600 items-center'> <BookmarkIcon/> Saved Item</a>
        <a href='' className='flex gap-1 hover:text-indigo-600 items-center'> <GroupIcon/> Group</a>
        <a href='' className='flex gap-1 hover:text-indigo-600 items-center'> <EyeIcon/> Profile Viewer</a>
      </div>
    </div>
  )
}

export default ProfileItemCard