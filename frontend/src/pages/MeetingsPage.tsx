import { MeetingsView } from "@/components/Meetings/meetings-view";
import { useAppLayout } from "../layouts/useAppLayout";

/** MeetingsView's "New meeting" button opens the dialog that AppLayout owns. */
export function MeetingsPage() {
  const { openNewMeeting } = useAppLayout();
  return <MeetingsView onOpenNew={openNewMeeting} />;
}
