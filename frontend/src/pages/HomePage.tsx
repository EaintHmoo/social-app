import CreatePost from "../components/Feed/PostCard"
import FeedList from "../components/Feed/FeedList"
import FriendList from "../components/Feed/FriendList"
import ProfileCard from "../components/Feed/ProfileCard"
import ProfileItemCard from "../components/Feed/ProfileItemCard"

const HomePage = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {/* Left sidebar */}
      <aside className="flex flex-col gap-2 sm:sticky sm:top-20 sm:self-start sm:max-h-[calc(100dvh-6rem)] sm:overflow-y-auto no-scrollbar">
        <ProfileCard />
        <ProfileItemCard />
      </aside>

      {/* Feed */}
      <div className="col-span-1 flex flex-col gap-2 sm:col-span-2">
        <CreatePost />
        <FeedList />
      </div>

      {/* Right sidebar */}
      <aside className="sm:sticky sm:top-20 sm:self-start">
        <FriendList />
      </aside>
    </div>
  );
};

export default HomePage