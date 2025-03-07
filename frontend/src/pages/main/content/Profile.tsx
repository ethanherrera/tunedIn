export default function Profile() {
  return (
    <div className="profile-container">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="mt-4 min-h-[50vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  )
} 