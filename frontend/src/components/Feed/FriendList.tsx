import ProfileItem from "./ProfileItem"

const FriendList = () => {
  return (
    <div className="flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-xl border border-gray-300 bg-white p-4">
      <h4 className="mb-3 text-base font-semibold">Add Friend</h4>

      <div className="-mr-2 grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto pr-2 scrollbar-none">
        {Array.from({ length: 16 }).map((_, i) => (
          <ProfileItem key={i} ownerName="Post Owner Name" id={i} />
        ))}
      </div>
    </div>
  );
};

export default FriendList