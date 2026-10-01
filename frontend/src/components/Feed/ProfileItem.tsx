import Avator from "./Avator"


type ProfileItemProps = {
  ownerName: string
  id: string
}

const ProfileItem = ({ownerName , id}:ProfileItemProps) => {
  return (
    <div className='flex gap-2 items-center'>
        <Avator/>
        <div className="mt-2">
            <h5 className='text-sm font-semibold'>{ownerName}</h5>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
            >
              + Add
            </button>
        </div>
    </div>
  )
}

export default ProfileItem